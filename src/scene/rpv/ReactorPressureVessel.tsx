/**
 * The BWRX-300 reactor pressure vessel and its internals (Stage 4), built from rpvData.ts and
 * the official core layout (coreLayout.ts).
 *
 * One group, placed at the vessel's inside bottom, so every child is authored in the GD's
 * datum ("height above the bottom of the vessel"). Draw-call budget: the closed vessel is six
 * meshes; the internals (eleven meshes, no shadow passes) are drawn only once the vessel
 * cutaway opens them (Interior level `reactor`). Repeated parts are merged per material; the
 * 240 fuel assemblies and 57 blades are instanced, so each stays addressable by index.
 */
import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { InstancedMesh, Matrix4, Vector3, type BufferGeometry, type Material, type Object3D } from 'three';
import { useQualityPreset } from '../../state/store';
import { REACTOR_PRESSURE_VESSEL as RPV } from '../plant/dimensions';
import { useDisposeOnChange } from '../plant/hooks';
import { meta, PLANT_IDS } from '../plant/ids';
import { getSectionMaterials } from '../plant/materials';
import { Interior } from '../plant/section';
import { RPV_COMPONENT_IDS as IDS, type RpvComponentId } from './components';
import { heroReveal } from '../../animation/heroReveal';
import { bladeStateVersion, CONTROL_BLADES, FUEL_BUNDLES } from './coreLayout';
import {
  createBladeUnit,
  createBundleUnit,
  createChimney,
  createChimneyHead,
  createCorePlate,
  createDrives,
  createDryer,
  createGuideTubesAndSupports,
  createLowerHead,
  createSeparators,
  createShell,
  createShroud,
  createShroudSupport,
  createStuds,
  createTopGuide,
  createUpperHead,
  createVesselAppurtenances,
  mergeParts,
  RPV_DETAIL,
} from './rpvGeometry';
import { BLADE, CORE, DOWNCOMER } from './rpvData';

interface PartProps {
  id: RpvComponentId;
  geometry: BufferGeometry;
  material: Material;
  /** Only the vessel's outer shell casts shadows; the internals are lit like an illustration. */
  shadows?: boolean;
}

function Part({ id, geometry, material, shadows = false }: PartProps) {
  return <mesh name={id} userData={{ componentId: id }} geometry={geometry} material={material} castShadow={shadows} receiveShadow={shadows} />;
}

function Component({ id, children }: { id: RpvComponentId; children: ReactNode }) {
  return (
    <group name={id} userData={{ componentId: id }}>
      {children}
    </group>
  );
}

export function ReactorPressureVessel() {
  const detail = RPV_DETAIL[useQualityPreset().geometryLod];
  const m = getSectionMaterials();

  const vessel = useMemo(() => {
    const appurtenances = createVesselAppurtenances(detail);
    const drives = createDrives(detail);
    return {
      lowerHead: createLowerHead(detail),
      shell: mergeParts([createShell(detail), appurtenances.other]),
      upperHead: mergeParts([createUpperHead(detail), createStuds(detail)]),
      steamNozzles: appurtenances.steamNozzles,
      housings: drives.housings,
      motors: drives.motors,
    };
  }, [detail]);
  useDisposeOnChange(...Object.values(vessel));

  return (
    <group name={IDS.rpv} userData={{ ...meta(PLANT_IDS.rpv, 'official', false), componentId: IDS.rpv }} position-y={RPV.insideBottomY}>
      <Part id={IDS.upperHead} geometry={vessel.upperHead} material={m.vessel.steel} shadows />
      <Part id={IDS.shell} geometry={vessel.shell} material={m.vessel.steel} shadows />
      <Part id={IDS.lowerHead} geometry={vessel.lowerHead} material={m.vessel.steel} shadows />
      <Part id={IDS.mainSteamNozzle} geometry={vessel.steamNozzles} material={m.vessel.steel} shadows />
      <Component id={IDS.controlRodDrives}>
        <mesh name="crd-housings" geometry={vessel.housings} material={m.vessel.steel} receiveShadow />
        <mesh name="crd-motors" geometry={vessel.motors} material={m.vessel.driveMotor} receiveShadow />
      </Component>
      <Interior level="reactor">
        <VesselInternals />
      </Interior>
    </group>
  );
}

function VesselInternals() {
  const detail = RPV_DETAIL[useQualityPreset().geometryLod];
  const m = getSectionMaterials();

  const g = useMemo(() => {
    const lower = createGuideTubesAndSupports(detail);
    return {
      shroudSupport: createShroudSupport(detail),
      corePlate: createCorePlate(detail),
      guideTubes: mergeParts([lower.guideTubes, lower.supports]),
      topGuide: createTopGuide(detail, CORE.cellPitch),
      shroud: createShroud(detail),
      chimney: createChimney(detail),
      chimneyHead: createChimneyHead(detail),
      separators: createSeparators(detail),
      dryer: createDryer(detail),
    };
  }, [detail]);
  useDisposeOnChange(...Object.values(g));

  return (
    <>
      <Part id={IDS.shroudSupport} geometry={g.shroudSupport} material={m.internals.supportSteel} />
      <Part id={IDS.guideTubes} geometry={g.guideTubes} material={m.internals.supportSteel} />
      <Part id={IDS.coreShroud} geometry={g.shroud} material={m.internals.stainless} />
      <Component id={IDS.core}>
        <Part id={IDS.corePlate} geometry={g.corePlate} material={m.internals.stainless} />
        <FuelBundles />
        <ControlBlades />
        <Part id={IDS.topGuide} geometry={g.topGuide} material={m.internals.stainless} />
      </Component>
      <Part id={IDS.chimney} geometry={g.chimney} material={m.internals.chimney} />
      <Part id={IDS.chimneyHead} geometry={g.chimneyHead} material={m.internals.stainless} />
      <Part id={IDS.steamSeparators} geometry={g.separators} material={m.internals.stainless} />
      <Part id={IDS.steamDryer} geometry={g.dryer} material={m.internals.dryer} />
      {/* A region, not a part: Stage 5 focus/highlight and the Stage 7 return-flow path use it. */}
      <group name={IDS.downcomer} userData={{ componentId: IDS.downcomer, region: { kind: 'annulus', ...DOWNCOMER } }} />
    </>
  );
}

const _m = new Matrix4();

/** Is the object drawn at all (every ancestor visible)? */
function isShown(object: Object3D): boolean {
  for (let o: Object3D | null = object; o; o = o.parent) if (!o.visible) return false;
  return true;
}

/**
 * 240 assemblies, one draw call. Instances are kept sorted front to back from the camera (the
 * depth test then rejects the hidden ones instead of shading ~18 layers of channels), so the
 * instance index is not the bundle index: `userData.instanceToBundle[i]` maps an instance (e.g.
 * a Stage 5 raycast hit) to FUEL_BUNDLES, whose ids never change.
 */
function FuelBundles() {
  const ref = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => createBundleUnit(), []);
  useDisposeOnChange(geometry);
  const order = useMemo(() => FUEL_BUNDLES.map((_, i) => i), []);
  const distance = useMemo(() => new Float32Array(FUEL_BUNDLES.length), []);
  const sortedFrom = useRef(new Vector3(Infinity, 0, 0));

  const writeMatrices = (mesh: InstancedMesh) => {
    order.forEach((bundle, i) => mesh.setMatrixAt(i, _m.makeTranslation(FUEL_BUNDLES[bundle]!.x, 0, FUEL_BUNDLES[bundle]!.z)));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.userData.instanceToBundle = order;
  };

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    writeMatrices(mesh);
    mesh.computeBoundingSphere();
    sortedFrom.current.set(Infinity, 0, 0);
  }, [geometry]); // eslint-disable-line react-hooks/exhaustive-deps

  const materials = getSectionMaterials().fuel;
  useFrame(({ camera }) => {
    const mesh = ref.current;
    if (!mesh || !isShown(mesh)) return;
    // Only the horizontal core section cuts through assemblies: only then draw cut surfaces.
    mesh.material = heroReveal.coreSection > 0 ? materials.channelCapped : materials.channel;
    if (camera.position.distanceToSquared(sortedFrom.current) < 0.01) return;
    sortedFrom.current.copy(camera.position);
    // Plan distance is enough: the assemblies are parallel vertical prisms.
    const { x, z } = camera.position;
    FUEL_BUNDLES.forEach((b, i) => (distance[i] = (b.x - x) ** 2 + (b.z - z) ** 2));
    order.sort((a, b) => distance[a]! - distance[b]!);
    writeMatrices(mesh);
  });

  return (
    <>
      <instancedMesh
        ref={ref}
        name={IDS.fuelBundles}
        userData={{ componentId: IDS.fuelBundles, instanceIds: FUEL_BUNDLES.map((b) => b.id) }}
        args={[geometry, materials.channel, FUEL_BUNDLES.length]}
      />
      {/* Never drawn: makes the ready gate's warm-up compile the capped variant, so switching
          to it during a review transition never compiles a shader. */}
      <instancedMesh name="fuel-bundles.capped-variant" visible={false} args={[geometry, materials.channelCapped, 1]} />
    </>
  );
}

/** 57 cruciform blades, one draw call; heights follow each blade's `insertion` data. */
function ControlBlades() {
  const ref = useRef<InstancedMesh>(null);
  const detail = RPV_DETAIL[useQualityPreset().geometryLod];
  const geometry = useMemo(() => createBladeUnit(detail), [detail]);
  useDisposeOnChange(geometry);
  const applied = useRef(-1);

  const update = (mesh: InstancedMesh) => {
    CONTROL_BLADES.forEach((blade, i) => {
      // Absorber bottom: at the bottom of active fuel when fully inserted, one blade length
      // lower (inside its guide tube) when fully withdrawn.
      const y = CORE.bottomOfActiveFuelH - (1 - blade.insertion) * BLADE.length;
      mesh.setMatrixAt(i, _m.makeTranslation(blade.position[0], y, blade.position[1]));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    applied.current = bladeStateVersion();
  };

  useLayoutEffect(() => {
    if (ref.current) update(ref.current);
  });
  useFrame(() => {
    if (ref.current && applied.current !== bladeStateVersion()) update(ref.current);
  });

  return (
    <instancedMesh
      ref={ref}
      name={IDS.controlBlades}
      userData={{ componentId: IDS.controlBlades, instanceIds: CONTROL_BLADES.map((b) => b.id) }}
      args={[geometry, getSectionMaterials().blades.blade, CONTROL_BLADES.length]}
    />
  );
}
