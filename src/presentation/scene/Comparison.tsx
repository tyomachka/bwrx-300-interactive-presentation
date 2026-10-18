/**
 * Presentation v1, "what small modular changes" (talk only):
 *  - k.large    a large BWR-family unit (the ESBWR class, ~1,500 MW) rises out of the ground west of
 *               our BWRX-300, at the same scale (presentation/scene/comparisonLayout.ts);
 *  - k.modules  four more BWRX-300 power blocks assemble one after another north of ours
 *               (reactor building first, then the turbine hall): 5 x 300 MW;
 *  - k.largeDim the large unit steps back into the X-ray dither once the modules stand.
 *
 * [MATCHED SCALE · LAYOUT ILLUSTRATIVE] One ground scale and one camera for both. The large unit is a
 * simplified BWR plant massing (comparisonLayout.ts says how it is sized), not a drawing of a design;
 * the vessels themselves are compared exactly in the overlay (TalkOverlay.tsx VesselDiagram). The
 * copies are our plant's own reactor building and turbine hall massing, without the support
 * buildings. Construction-style growth from the ground, not a claim that anything arrives assembled.
 */
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { BoxGeometry, CanvasTexture, ConeGeometry, CylinderGeometry, MathUtils, MeshBasicMaterial, PlaneGeometry, type BufferGeometry, type Group, type Mesh, type MeshStandardMaterial } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RADIAL_SEGMENTS } from '../../config/quality';
import { REACTOR_BUILDING as RB, TURBINE_BUILDING as TB } from '../../scene/plant/dimensions';
import { cloneForComponent, getPlantMaterials } from '../../scene/plant/materials';
import { requestShadowUpdate } from '../../scene/section/sectionLayers';
import { createExploreUniforms } from '../../scene/section/sectionShader';
import { useQualityPreset } from '../../state/store';
import { world } from '../world';
import { LARGE_UNIT as LARGE, MODULE_OFFSETS } from './comparisonLayout';

const box = (size: readonly [number, number, number], at: readonly [number, number, number]) =>
  new BoxGeometry(size[0], size[1], size[2]).translate(at[0], at[1] + size[1] / 2, at[2]);

const merge = (parts: BufferGeometry[]) => {
  const g = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)), false)!;
  parts.forEach((p) => p.dispose());
  return g;
};

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
  const { reactor, reactorTop, turbine, control, radwaste } = LARGE;
  // Reactor building (with its roof structure) and the auxiliary buildings: one pale concrete draw.
  const concrete = merge([box(reactor.size, reactor.offset), box(reactorTop.size, reactorTop.offset), box(control.size, control.offset), box(radwaste.size, radwaste.offset)]);
  const hall = merge([box(turbine.size, turbine.offset), box([turbine.size[0] - 8, 3, turbine.size[2] - 8], [turbine.offset[0], turbine.size[1], turbine.offset[2]])]);
  return { concrete, hall };
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

const ease = (x: number) => MathUtils.smootherstep(x, 0, 1);

export function Comparison() {
  const segments = RADIAL_SEGMENTS[useQualityPreset().geometryLod];
  const large = useMemo(() => buildLarge(), []);
  const unit = useMemo(() => buildModule(segments), [segments]);
  const m = getPlantMaterials();
  // Own copies (same programs) so the large unit can ghost alone, and the pale cladding of a
  // reactor building without its section clipping.
  const mats = useMemo(() => {
    const ghostUniforms = createExploreUniforms();
    const concrete = cloneForComponent(m.supportCladding, ghostUniforms);
    concrete.color.set('#8b8f93');
    const hall = cloneForComponent(m.darkMetal, ghostUniforms);
    const pale = cloneForComponent(m.supportCladding, createExploreUniforms());
    pale.color.set('#8b8f93');
    return { concrete, hall, pale, ghostUniforms, shadow: softShadow(0), moduleShadow: softShadow(0.7) };
  }, [m]);
  const shadowGeometry = useMemo(() => new PlaneGeometry(1, 1).rotateX(-Math.PI / 2), []);

  const root = useRef<Group>(null);
  const largeParts = useRef<(Group | null)[]>([]);
  const largeShadow = useRef<Mesh>(null);
  const moduleReactors = useRef<(Group | null)[]>([]);
  const moduleHalls = useRef<(Group | null)[]>([]);
  const moduleShadows = useRef<(Mesh | null)[]>([]);

  useEffect(
    () => () => {
      for (const g of [large.concrete, large.hall, unit.reactor, unit.hall, shadowGeometry]) g.dispose();
    },
    [large, unit, shadowGeometry],
  );
  useEffect(
    () => () => {
      for (const mat of [mats.concrete, mats.hall, mats.pale] as MeshStandardMaterial[]) mat.dispose();
      for (const shadow of [mats.shadow, mats.moduleShadow]) {
        shadow.map?.dispose();
        shadow.dispose();
      }
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
    // Large unit: the reactor and auxiliary buildings, then the turbine hall (staggered rise).
    const p = world['k.large'];
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
      mats.shadow.opacity = ease(p) * (1 - 0.6 * world['k.largeDim']);
    }
    mats.ghostUniforms.uExploreGhost.value = 0.82 * world['k.largeDim'];

    // Modules: each assembles over one unit of k.modules, reactor building first.
    const k = world['k.modules'];
    MODULE_OFFSETS.forEach((_, i) => {
      const local = MathUtils.clamp(k - i, 0, 1);
      const r = ease(MathUtils.clamp(local / 0.6, 0, 1));
      const h = ease(MathUtils.clamp((local - 0.35) / 0.65, 0, 1));
      const reactor = moduleReactors.current[i];
      const hall = moduleHalls.current[i];
      const shadow = moduleShadows.current[i];
      if (reactor) {
        reactor.scale.y = Math.max(r, 1e-3);
        reactor.visible = r > 0.002;
      }
      if (hall) {
        hall.scale.y = Math.max(h, 1e-3);
        hall.visible = h > 0.002;
      }
      if (shadow) shadow.visible = local > 0.002;
    });
  }, -80);

  const [cx, , cz] = LARGE.center;
  return (
    <group ref={root} name="talk-comparison" visible={false}>
      <group position={[cx, 0, cz]}>
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
            <mesh geometry={unit.hall} material={m.darkMetal} castShadow receiveShadow />
          </group>
          <mesh
            ref={(s) => void (moduleShadows.current[i] = s)}
            geometry={shadowGeometry}
            material={mats.moduleShadow}
            position={[42, 0.05, 0]}
            scale={[170, 1, 80]}
            renderOrder={-1}
          />
        </group>
      ))}
    </group>
  );
}
