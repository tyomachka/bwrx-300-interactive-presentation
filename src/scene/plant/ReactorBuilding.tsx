/**
 * Reactor building massing, nested as the physical hierarchy:
 *   ground -> reactor-building-shaft -> containment-placeholder -> reactor-pressure-vessel-placeholder
 * plus the above-grade superstructure (pools, refuelling floor, roof).
 *
 * The key idea (GD §10, NEDO-34163 §1.6): the RPV and containment sit in the deeply
 * embedded, below-grade shaft. The above-grade cylinder holds the pools and fuel handling,
 * not the reactor.
 *
 * Each structure uses the section materials of the reveal layer that opens it
 * (scene/section/sectionLayers.ts): building + shaft, then containment; the RPV is never cut.
 */
import { useMemo } from 'react';
import { ConeGeometry, CylinderGeometry, SphereGeometry } from 'three';
import { RADIAL_SEGMENTS } from '../../config/quality';
import { useQualityPreset } from '../../state/store';
import { CONTAINMENT, POOLS, REACTOR_BUILDING as RB, REACTOR_PRESSURE_VESSEL as RPV } from './dimensions';
import { insetBox, SECTION_INSET, type BoxExtents, type ProfilePoint } from './geometry';
import { useDisposeOnChange, useHalfSegments } from './hooks';
import { meta, PLANT_IDS } from './ids';
import { getSectionMaterials } from './materials';
import { Box, InstancedBoxes } from './primitives';
import { Interior, SectionProfile, SectionSector } from './section';

const shaftInner = RB.shaftOuterRadius - RB.shaftWall;
const rbInner = RB.aboveGradeRadius - RB.aboveGradeWall;
const wallTop = RB.aboveGradeHeight;
const BAND_INSET = 0.12;
const ROOF_RADIUS = RB.aboveGradeRadius + RB.roofOverhang;
/** Few, flat-shaded roof segments read as the radial roof panels drawn in Fig 2-1. */
const ROOF_PANELS = 24;

const containmentBottom = -RB.shaftDepth + RB.basematThickness; // sits on the common basemat
const containmentTop = -RB.shaftDepth + CONTAINMENT.height; // = +2 m
const slabBottom = containmentTop - CONTAINMENT.topSlab;
const pedestalTop = containmentBottom + CONTAINMENT.pedestal.height; // seats the RPV skirt

const { pedestal } = CONTAINMENT;
const E = SECTION_INSET;
const containmentInner = CONTAINMENT.outerRadius - CONTAINMENT.wall;

/** Containment wall + top slab, (r, y) counter-clockwise. Inset where it rests on the basemat. */
const CONTAINMENT_PROFILE: ProfilePoint[] = [
  [containmentInner, containmentBottom + E],
  [CONTAINMENT.outerRadius - E, containmentBottom + E],
  [CONTAINMENT.outerRadius - E, containmentTop - E],
  [CONTAINMENT.openingRadius, containmentTop - E],
  [CONTAINMENT.openingRadius, slabBottom],
  [containmentInner, slabBottom],
];

/** Pedestal ring + the inner ledge under the RPV skirt (ledge clear of the vessel by the inset). */
const PEDESTAL_PROFILE: ProfilePoint[] = [
  [pedestal.innerRadius, containmentBottom + E],
  [pedestal.outerRadius - E, containmentBottom + E],
  [pedestal.outerRadius - E, pedestalTop - E],
  [RPV.outerRadius + E, pedestalTop - E],
  [RPV.outerRadius + E, pedestalTop - 0.8],
  [pedestal.innerRadius, pedestalTop - 0.8],
];

const cavityPool: BoxExtents = insetBox({
  x: [-POOLS.cavity.halfSize, POOLS.cavity.halfSize],
  y: [POOLS.cavity.bottomY, POOLS.topY],
  z: [-POOLS.cavity.halfSize, POOLS.cavity.halfSize],
});
const icsPools: BoxExtents[] = POOLS.ics.map(({ center: [cx, cz], size: [sx, sz] }) =>
  insetBox({
    x: [cx - sx / 2, cx + sx / 2],
    y: [POOLS.icsBottomY, POOLS.topY],
    z: [cz - sz / 2, cz + sz / 2],
  }),
);

export function ReactorBuilding() {
  const m = getSectionMaterials().building;

  return (
    <group name="reactor-building">
      {/* ---------------- Below grade: the deeply embedded shaft ---------------- */}
      <group name={PLANT_IDS.reactorBuildingShaft} userData={meta(PLANT_IDS.reactorBuildingShaft, 'official-constrained')}>
        {/* The shaft wall stays drawn: its collar is visible at grade, its outside once the ground is cut. */}
        <SectionSector
          name="rb.shaftWall"
          innerRadius={shaftInner}
          outerRadius={RB.shaftOuterRadius}
          y0={containmentBottom}
          height={-containmentBottom + RB.collarHeight}
          material={m.concrete}
        />
        <Interior level="belowGrade">
          <SectionSector name="rb.basemat" innerRadius={0} outerRadius={RB.shaftOuterRadius} y0={-RB.shaftDepth} height={RB.basematThickness} material={m.concreteDark} />
        </Interior>
        <Interior level="building">
          {RB.shaftFloorLevels.map((y) => (
            <SectionSector
              key={y}
              name={`rb.floor${y}`}
              innerRadius={CONTAINMENT.outerRadius}
              outerRadius={shaftInner}
              y0={y}
              height={RB.floorThickness}
              material={m.concreteDark}
              castShadow={false}
            />
          ))}
          {/* Grade-level floor around the containment top. */}
          <SectionSector name="rb.gradeFloor" innerRadius={CONTAINMENT.outerRadius} outerRadius={shaftInner} y0={-RB.floorThickness} height={RB.floorThickness} material={m.concreteDark} castShadow={false} />
          <Containment />
        </Interior>
      </group>

      {/* ---------------- Above grade: pools, refuelling floor, roof ---------------- */}
      <group name={PLANT_IDS.reactorBuildingAboveGrade} userData={meta(PLANT_IDS.reactorBuildingAboveGrade, 'educational-approximation')}>
        {/* Starts on the shaft's grade collar, not inside it: section solids never overlap. */}
        <SectionSector name="rb.wallLower" innerRadius={rbInner} outerRadius={RB.aboveGradeRadius} y0={RB.collarHeight} height={RB.refuelFloorY - RB.collarHeight} material={m.cladding} />
        <SectionSector
          name="rb.band"
          innerRadius={rbInner}
          outerRadius={RB.aboveGradeRadius - BAND_INSET}
          y0={RB.refuelFloorY}
          height={RB.refuelFloorThickness}
          material={m.band}
        />
        <SectionSector
          name="rb.wallUpper"
          innerRadius={rbInner}
          outerRadius={RB.aboveGradeRadius}
          y0={RB.refuelFloorY + RB.refuelFloorThickness}
          height={wallTop - RB.refuelFloorY - RB.refuelFloorThickness}
          material={m.cladding}
        />
        <RoofCone />

        <Interior level="building">
          <SectionSector name="rb.refuelFloor" innerRadius={0} outerRadius={rbInner} y0={RB.refuelFloorY} height={RB.refuelFloorThickness} material={m.concrete} castShadow={false} />
        </Interior>
        {/* The pools belong to later chapters (passive cooling): only the section review shows them,
            so the hero reveal keeps attention below grade. */}
        <Interior level="review">
          <group name={PLANT_IDS.pools} userData={meta(PLANT_IDS.pools, 'educational-approximation')}>
            <Box name="pool.cavity" {...cavityPool} material={m.water} castShadow={false} />
            <InstancedBoxes name="pool.ics" boxes={icsPools} material={m.water} castShadow={false} />
          </group>
        </Interior>

        {/* Personnel entrance on the south face: architectural scale cue at grade. */}
        <Box name="rb.entrance" {...insetBox({ x: [-3, 3], y: [RB.collarHeight, 5], z: [RB.aboveGradeRadius - 0.6, RB.aboveGradeRadius + 0.15] })} material={m.doorPanel} />
        <Box name="rb.canopy" {...insetBox({ x: [-4, 4], y: [5, 5.4], z: [RB.aboveGradeRadius - 0.6, RB.aboveGradeRadius + 2.4] })} material={m.band} />
      </group>
    </group>
  );
}

function RoofCone() {
  const m = getSectionMaterials().building;
  const geometry = useMemo(() => new ConeGeometry(ROOF_RADIUS, RB.roofRise, ROOF_PANELS, 1, true), []);
  useDisposeOnChange(geometry);
  return <mesh name="rb.roof" geometry={geometry} material={m.roof} position-y={RB.aboveGradeHeight + RB.roofRise / 2} castShadow receiveShadow />;
}

function Containment() {
  const m = getSectionMaterials().containment;
  const segments = RADIAL_SEGMENTS[useQualityPreset().geometryLod];
  const head = useMemo(
    () => new SphereGeometry(CONTAINMENT.closureHeadRadius, segments, Math.max(4, segments / 8), 0, Math.PI * 2, 0, Math.PI / 2),
    [segments],
  );
  useDisposeOnChange(head);
  const headScaleY = CONTAINMENT.closureHeadRise / CONTAINMENT.closureHeadRadius;

  return (
    <group name={PLANT_IDS.containment} userData={meta(PLANT_IDS.containment, 'official-constrained')}>
      {/* Wall and top slab as one solid: its section is one continuous steel-composite shape. */}
      <SectionProfile name="containment.vessel" profile={CONTAINMENT_PROFILE} material={m.wall} />
      <mesh name="containment.head" geometry={head} material={m.head} position-y={containmentTop} scale-y={headScaleY} castShadow />

      {/* RPV support: pedestal ring with the ledge that carries the vessel skirt, as one solid. */}
      <SectionProfile name="containment.pedestal" profile={PEDESTAL_PROFILE} material={m.concrete} />

      <Interior level="vessel">
        <ReactorPressureVessel />
      </Interior>
    </group>
  );
}

/** Whole, never sectioned: the subject the reveal ends on. Stage 4 replaces it. */
function ReactorPressureVessel() {
  const m = getSectionMaterials().vessel;
  const segments = useHalfSegments();
  const r = RPV.outerRadius;
  const shell = RPV.height - 2 * r;
  const geometries = useMemo(
    () => ({
      shell: new CylinderGeometry(r, r, shell, segments * 2, 1, true),
      bottom: new SphereGeometry(r, segments * 2, segments / 2, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      top: new SphereGeometry(r, segments * 2, segments / 2, 0, Math.PI * 2, 0, Math.PI / 2),
    }),
    [r, shell, segments],
  );
  useDisposeOnChange(geometries.shell, geometries.bottom, geometries.top);

  return (
    <group name={PLANT_IDS.rpv} position-y={RPV.topY - RPV.height} userData={meta(PLANT_IDS.rpv, 'official')}>
      <mesh geometry={geometries.bottom} material={m.steel} position-y={r} castShadow receiveShadow />
      <mesh geometry={geometries.shell} material={m.steel} position-y={r + shell / 2} castShadow receiveShadow />
      <mesh geometry={geometries.top} material={m.steel} position-y={r + shell} castShadow receiveShadow />
    </group>
  );
}
