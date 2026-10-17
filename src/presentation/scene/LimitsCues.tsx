/**
 * Presentation v1, chapter 11 "challenges" (talk only): the one physical cue of the three limits.
 *
 *   l.casks  a small pad of spent-fuel storage casks rises beside the reactor building (0..1,
 *            staggered); the label "ATLIEKOS / spent fuel must be stored" is anchored on it.
 *
 * [ILLUSTRATIVE] A generic dry-storage silhouette (vertical casks ~3.4 m across, ~5.8 m tall on a
 * concrete pad), not the BWRX-300's spent-fuel design and no claim about where or how its fuel is
 * stored: a calm, physical "the fuel has to go somewhere", never a radiation symbol. Licensing and
 * first-of-a-kind risk are drawn cues in their labels (presentation/ui/TalkOverlay.tsx).
 * Cheap on purpose: one merged pad and one instanced cylinder, drawn only in this chapter.
 */
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { BoxGeometry, CylinderGeometry, MathUtils, type Group, type InstancedMesh, Matrix4, type MeshStandardMaterial } from 'three';
import { RADIAL_SEGMENTS } from '../../config/quality';
import { cloneForComponent, getPlantMaterials } from '../../scene/plant/materials';
import { requestShadowUpdate } from '../../scene/section/sectionLayers';
import { createExploreUniforms } from '../../scene/section/sectionShader';
import { useQualityPreset } from '../../state/store';
import { world } from '../world';
import { LIMITS_PAD } from './limitsLayout';

const CASKS = LIMITS_PAD.rows * LIMITS_PAD.perRow;
const ease = (x: number) => MathUtils.smootherstep(x, 0, 1);
const _m = new Matrix4();

export function LimitsCues() {
  const segments = RADIAL_SEGMENTS[useQualityPreset().geometryLod];
  const geometry = useMemo(() => {
    const { size, cask } = LIMITS_PAD;
    return {
      pad: new BoxGeometry(size[0], size[1], size[2]).translate(0, size[1] / 2, 0),
      // Pivot at the base: casks rise from the pad.
      cask: new CylinderGeometry(cask.radius, cask.radius, cask.height, Math.max(16, segments / 2)).translate(0, cask.height / 2, 0),
    };
  }, [segments]);
  const m = getPlantMaterials();
  const materials = useMemo(() => {
    const pad = cloneForComponent(m.supportCladding, createExploreUniforms());
    pad.color.set('#6c7075');
    const cask = cloneForComponent(m.supportCladding, createExploreUniforms());
    cask.color.set('#9a9ea3');
    return { pad, cask };
  }, [m]);
  const root = useRef<Group>(null);
  const casks = useRef<InstancedMesh>(null);
  /** The rise last written (matrices and the shadow map change only while it moves). */
  const written = useRef(-1);

  useEffect(() => () => void (geometry.pad.dispose(), geometry.cask.dispose()), [geometry]);
  useEffect(() => () => void [materials.pad, materials.cask].forEach((x: MeshStandardMaterial) => x.dispose()), [materials]);

  useFrame(() => {
    const p = world['l.casks'];
    const show = p > 0.002;
    if (root.current && root.current.visible !== show) {
      root.current.visible = show;
      requestShadowUpdate();
    }
    if (!show || !casks.current || p === written.current) return;
    written.current = p;
    const { rows, perRow, pitch, size } = LIMITS_PAD;
    for (let i = 0; i < CASKS; i++) {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      // Staggered rise, front row first.
      const s = ease(MathUtils.clamp((p - i * 0.06) / 0.58, 0, 1));
      _m.makeScale(1, Math.max(s, 1e-3), 1).setPosition((col - (perRow - 1) / 2) * pitch, size[1], (row - (rows - 1) / 2) * pitch * 1.15);
      casks.current.setMatrixAt(i, _m);
    }
    casks.current.instanceMatrix.needsUpdate = true;
    requestShadowUpdate();
  }, -80);

  const [x, , z] = LIMITS_PAD.center;
  return (
    <group ref={root} name="talk-limits" position={[x, 0, z]} visible={false}>
      <mesh geometry={geometry.pad} material={materials.pad} receiveShadow />
      <instancedMesh ref={casks} args={[geometry.cask, materials.cask, CASKS]} castShadow receiveShadow frustumCulled={false} />
    </group>
  );
}
