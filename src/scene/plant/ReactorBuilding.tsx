/**
 * Reactor building massing, nested as the physical hierarchy:
 *   ground -> reactor-building-shaft -> containment-placeholder -> reactor-pressure-vessel-placeholder
 * plus the above-grade superstructure (pools, refuelling floor, roof).
 *
 * The key idea (GD §10): the RPV and containment sit in the deeply embedded, below-grade
 * shaft. The above-grade cylinder holds the pools and fuel handling, not the reactor.
 */
import { useMemo } from 'react';
import { ConeGeometry, CylinderGeometry, SphereGeometry } from 'three';
import { CONTAINMENT, POOLS, REACTOR_BUILDING as RB, REACTOR_PRESSURE_VESSEL as RPV } from './dimensions';
import { HALF_PHI, HALF_THETA, HALVES, splitAtZ0, type BoxExtents } from './geometry';
import { useDisposeOnChange, useHalfSegments } from './hooks';
import { meta, PLANT_IDS } from './ids';
import { getPlantMaterials } from './materials';
import { Box, InstancedBoxes } from './primitives';
import { FrontOfSection, Interior, SplitSector } from './section';

const shaftInner = RB.shaftOuterRadius - RB.shaftWall;
const rbInner = RB.aboveGradeRadius - RB.aboveGradeWall;
const wallTop = RB.aboveGradeHeight;
const BAND_INSET = 0.12;
const ROOF_RADIUS = RB.aboveGradeRadius + RB.roofOverhang;
/** Few, flat-shaded roof segments read as the radial roof panels drawn in Fig 2-1. */
const ROOF_PANELS_PER_HALF = 12;

const containmentBottom = -RB.shaftDepth + RB.basematThickness; // sits on the common basemat
const containmentTop = -RB.shaftDepth + CONTAINMENT.height; // = +2 m
const slabBottom = containmentTop - CONTAINMENT.topSlab;
const pedestalTop = containmentBottom + CONTAINMENT.pedestal.height; // seats the RPV skirt

const cavityPool: BoxExtents = {
  x: [-POOLS.cavity.halfSize, POOLS.cavity.halfSize],
  y: [POOLS.cavity.bottomY, POOLS.topY],
  z: [-POOLS.cavity.halfSize, POOLS.cavity.halfSize],
};
const icsPools: BoxExtents[] = POOLS.ics.map(({ center: [cx, cz], size: [sx, sz] }) => ({
  x: [cx - sx / 2, cx + sx / 2],
  y: [POOLS.icsBottomY, POOLS.topY],
  z: [cz - sz / 2, cz + sz / 2],
}));

export function ReactorBuilding() {
  const m = getPlantMaterials();

  return (
    <group name="reactor-building">
      {/* ---------------- Below grade: the deeply embedded shaft ---------------- */}
      <group name={PLANT_IDS.reactorBuildingShaft} userData={meta(PLANT_IDS.reactorBuildingShaft, 'official-constrained')}>
        {/* The shaft wall stays drawn: its collar is visible at grade. Everything inside it is Interior. */}
        <SplitSector
          name="rb.shaftWall"
          innerRadius={shaftInner}
          outerRadius={RB.shaftOuterRadius}
          y0={containmentBottom}
          height={-containmentBottom + RB.collarHeight}
          material={m.concrete}
        />
        <Interior>
          <SplitSector name="rb.basemat" innerRadius={0} outerRadius={RB.shaftOuterRadius} y0={-RB.shaftDepth} height={RB.basematThickness} material={m.concreteDark} />
          {RB.shaftFloorLevels.map((y) => (
            <SplitSector
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
          <SplitSector name="rb.gradeFloor" innerRadius={CONTAINMENT.outerRadius} outerRadius={shaftInner} y0={-RB.floorThickness} height={RB.floorThickness} material={m.concreteDark} castShadow={false} />
          <Containment />
        </Interior>
      </group>

      {/* ---------------- Above grade: pools, refuelling floor, roof ---------------- */}
      <group name={PLANT_IDS.reactorBuildingAboveGrade} userData={meta(PLANT_IDS.reactorBuildingAboveGrade, 'educational-approximation')}>
        <SplitSector name="rb.wallLower" innerRadius={rbInner} outerRadius={RB.aboveGradeRadius} y0={0} height={RB.refuelFloorY} material={m.rbCladding} />
        <SplitSector
          name="rb.band"
          innerRadius={rbInner}
          outerRadius={RB.aboveGradeRadius - BAND_INSET}
          y0={RB.refuelFloorY}
          height={RB.refuelFloorThickness}
          material={m.rbBand}
        />
        <SplitSector
          name="rb.wallUpper"
          innerRadius={rbInner}
          outerRadius={RB.aboveGradeRadius}
          y0={RB.refuelFloorY + RB.refuelFloorThickness}
          height={wallTop - RB.refuelFloorY - RB.refuelFloorThickness}
          material={m.rbCladding}
        />
        <RoofCone />

        <Interior>
          <SplitSector name="rb.refuelFloor" innerRadius={0} outerRadius={rbInner} y0={RB.refuelFloorY} height={RB.refuelFloorThickness} material={m.concrete} castShadow={false} />
          <group name={PLANT_IDS.pools} userData={meta(PLANT_IDS.pools, 'educational-approximation')}>
            <Box name="pool.cavity.back" {...splitAtZ0(cavityPool).back} material={m.water} castShadow={false} />
            <FrontOfSection>
              <Box name="pool.cavity.front" {...splitAtZ0(cavityPool).front} material={m.water} castShadow={false} />
            </FrontOfSection>
            <InstancedBoxes name="pool.ics" boxes={icsPools} material={m.water} castShadow={false} />
          </group>
        </Interior>

        {/* Personnel entrance on the south face: architectural scale cue at grade. */}
        <FrontOfSection>
          <Box name="rb.entrance" x={[-3, 3]} y={[0.1, 5]} z={[RB.aboveGradeRadius - 0.6, RB.aboveGradeRadius + 0.15]} material={m.doorPanel} />
          <Box name="rb.canopy" x={[-4, 4]} y={[5, 5.4]} z={[RB.aboveGradeRadius - 0.6, RB.aboveGradeRadius + 2.4]} material={m.rbBand} />
        </FrontOfSection>
      </group>
    </group>
  );
}

function RoofCone() {
  const m = getPlantMaterials();
  const halves = useMemo(
    () =>
      HALVES.map((half) => {
        const { thetaStart, thetaLength } = HALF_THETA[half];
        return new ConeGeometry(ROOF_RADIUS, RB.roofRise, ROOF_PANELS_PER_HALF, 1, true, thetaStart, thetaLength);
      }),
    [],
  );
  useDisposeOnChange(...halves);
  const y = RB.aboveGradeHeight + RB.roofRise / 2;

  return (
    <>
      <mesh name="rb.roof.back" geometry={halves[0]} material={m.rbRoof} position-y={y} castShadow receiveShadow />
      <FrontOfSection>
        <mesh name="rb.roof.front" geometry={halves[1]} material={m.rbRoof} position-y={y} castShadow receiveShadow />
      </FrontOfSection>
    </>
  );
}

function Containment() {
  const m = getPlantMaterials();
  const segments = useHalfSegments();
  const head = useMemo(
    () =>
      HALVES.map((half) => {
        const { phiStart, phiLength } = HALF_PHI[half];
        return new SphereGeometry(CONTAINMENT.closureHeadRadius, segments, Math.max(4, segments / 4), phiStart, phiLength, 0, Math.PI / 2);
      }),
    [segments],
  );
  useDisposeOnChange(...head);
  const headScaleY = CONTAINMENT.closureHeadRise / CONTAINMENT.closureHeadRadius;
  const { pedestal } = CONTAINMENT;

  return (
    <group name={PLANT_IDS.containment} userData={meta(PLANT_IDS.containment, 'official-constrained')}>
      <SplitSector
        name="containment.wall"
        innerRadius={CONTAINMENT.outerRadius - CONTAINMENT.wall}
        outerRadius={CONTAINMENT.outerRadius}
        y0={containmentBottom}
        height={slabBottom - containmentBottom}
        material={m.containment}
      />
      <SplitSector
        name="containment.topSlab"
        innerRadius={CONTAINMENT.openingRadius}
        outerRadius={CONTAINMENT.outerRadius}
        y0={slabBottom}
        height={CONTAINMENT.topSlab}
        material={m.containment}
      />
      <mesh name="containment.head.back" geometry={head[0]} material={m.containmentHead} position-y={containmentTop} scale-y={headScaleY} castShadow />
      <FrontOfSection>
        <mesh name="containment.head.front" geometry={head[1]} material={m.containmentHead} position-y={containmentTop} scale-y={headScaleY} castShadow />
      </FrontOfSection>

      {/* RPV support: pedestal ring and the ledge that carries the vessel skirt. */}
      <SplitSector name="containment.pedestal" innerRadius={pedestal.innerRadius} outerRadius={pedestal.outerRadius} y0={containmentBottom} height={pedestalTop - containmentBottom} material={m.concreteDark} />
      <SplitSector name="containment.rpvSupport" innerRadius={RPV.outerRadius} outerRadius={pedestal.outerRadius} y0={pedestalTop - 0.8} height={0.8} material={m.concreteDark} />

      <ReactorPressureVessel />
    </group>
  );
}

/** Whole, never sectioned: the subject the section reveals. Stage 4 replaces it. */
function ReactorPressureVessel() {
  const m = getPlantMaterials();
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
