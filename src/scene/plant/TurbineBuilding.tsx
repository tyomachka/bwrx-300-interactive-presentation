/**
 * Turbine building: a separate hall east of the reactor building, across a seismic gap
 * (GD §10). Built as a hollow shell, so the section review shows the turbine-generator
 * inside. Turbine and generator are simple casings on a concrete deck, aligned with the
 * main steam axis (z = 0) so the steam path reads reactor -> HP -> LP -> generator.
 */
import { useMemo } from 'react';
import { CylinderGeometry, type Material } from 'three';
import { ShaftCouplings } from '../flow/ShaftCouplings';
import { ON_GRADE, TURBINE_BUILDING as TB, TURBINE_TRAIN as TRAIN } from './dimensions';
import { splitAtZ0, type BoxExtents, type Range } from './geometry';
import { useDisposeOnChange, useHalfSegments } from './hooks';
import { meta, PLANT_IDS } from './ids';
import { getPlantMaterials } from './materials';
import { Box, InstancedBoxes } from './primitives';
import { FrontOfSection, Interior } from './section';

const wallTop = TB.height + 0.6; // parapet above the roof deck
const [x0, x1] = TB.x;
const [zN, zS] = TB.z;

/** Facade fins every few metres, skipping the loading door on the south facade. */
function finBoxes(side: 'north' | 'south'): BoxExtents[] {
  const boxes: BoxExtents[] = [];
  const z: Range = side === 'south' ? [zS, zS + 0.9] : [zN - 0.9, zN];
  const doorHalf = TB.door.width / 2 + 0.8;
  for (let x = x0 + 3; x < x1 - 1; x += TB.finSpacing) {
    if (side === 'south' && Math.abs(x - TB.door.x) < doorHalf) continue;
    boxes.push({ x: [x - 0.225, x + 0.225], y: [ON_GRADE, wallTop], z });
  }
  return boxes;
}

const FINS = { north: finBoxes('north'), south: finBoxes('south') };

/** A few rooftop plant units, all behind the cut plane so the section never slices them. */
const ROOF_UNITS: BoxExtents[] = [
  { x: [40, 47], y: [TB.height, TB.height + 2.6], z: [-15, -9] },
  { x: [55, 60], y: [TB.height, TB.height + 2.2], z: [-16, -11] },
  { x: [78, 88], y: [TB.height, TB.height + 3], z: [-14, -6] },
];

const roof = splitAtZ0({ x: [x0, x1], y: [TB.height - TB.roof, TB.height], z: [zN, zS] });
const floor = splitAtZ0({ x: [x0, x1], y: [ON_GRADE, TB.floorTop], z: [zN, zS] });
const westWall = splitAtZ0({ x: [x0, x0 + TB.wall], y: [ON_GRADE, wallTop], z: [zN, zS] });
const eastWall = splitAtZ0({ x: [x1 - TB.wall, x1], y: [ON_GRADE, wallTop], z: [zN, zS] });

export function TurbineBuilding() {
  const m = getPlantMaterials();
  const hall = [m.darkMetal, m.darkMetal, m.roofMembrane, m.darkMetal, m.darkMetal, m.darkMetal];

  return (
    <group name={PLANT_IDS.turbineBuilding} userData={meta(PLANT_IDS.turbineBuilding, 'educational-approximation')}>
      {/* Behind the cut plane (always visible) */}
      <Interior level="turbineHall">
        <Box name="tb.floor.back" {...floor.back} material={m.concreteDark} castShadow={false} />
      </Interior>
      <Box name="tb.wall.north" x={[x0, x1]} y={[ON_GRADE, wallTop]} z={[zN, zN + TB.wall]} material={m.darkMetal} />
      <Box name="tb.wall.west.back" {...westWall.back} material={m.darkMetal} />
      <Box name="tb.wall.east.back" {...eastWall.back} material={m.darkMetal} />
      <Box name="tb.roof.back" {...roof.back} material={hall} />
      <InstancedBoxes name="tb.fins.north" boxes={FINS.north} material={m.fin} />
      <Box name="tb.glazing.north" x={[x0 + 0.4, x1 - 0.4]} y={[TB.glazing.bottom, TB.glazing.top]} z={[zN - 0.15, zN]} material={m.glazingLit} castShadow={false} />
      <InstancedBoxes name="tb.roofUnits" boxes={ROOF_UNITS} material={m.supportCladding} />

      {/* In front of the cut plane */}
      <FrontOfSection>
        <Box name="tb.wall.south" x={[x0, x1]} y={[ON_GRADE, wallTop]} z={[zS - TB.wall, zS]} material={m.darkMetal} />
        <Box name="tb.wall.west.front" {...westWall.front} material={m.darkMetal} />
        <Box name="tb.wall.east.front" {...eastWall.front} material={m.darkMetal} />
        <Box name="tb.roof.front" {...roof.front} material={hall} />
        <InstancedBoxes name="tb.fins.south" boxes={FINS.south} material={m.fin} />
        <Box name="tb.glazing.south" x={[x0 + 0.4, x1 - 0.4]} y={[TB.glazing.bottom, TB.glazing.top]} z={[zS, zS + 0.15]} material={m.glazingLit} castShadow={false} />
        <Box
          name="tb.loadingDoor"
          x={[TB.door.x - TB.door.width / 2, TB.door.x + TB.door.width / 2]}
          y={[TB.floorTop, TB.floorTop + TB.door.height]}
          z={[zS, zS + 0.25]}
          material={m.doorPanel}
        />
      </FrontOfSection>

      {/* Equipment is shown whole, never sectioned. */}
      <Interior level="turbineHall">
        <Box name="tb.turbineDeck" x={TB.deck.x} y={[TB.floorTop, TB.deck.top]} z={[-TB.deck.halfWidth, TB.deck.halfWidth]} material={m.concreteDark} />
        <TurbineGenerator />
      </Interior>
    </group>
  );
}

/** Horizontal casing along x, centred on the shaft line. */
function Casing({ name, x, radius, material }: { name: string; x: Range; radius: number; material: Material }) {
  const segments = useHalfSegments();
  const length = x[1] - x[0];
  const geometry = useMemo(() => new CylinderGeometry(radius, radius, length, segments * 2), [radius, length, segments]);
  useDisposeOnChange(geometry);
  return (
    <mesh name={name} geometry={geometry} material={material} position={[(x[0] + x[1]) / 2, TB.shaftY, 0]} rotation-z={Math.PI / 2} castShadow receiveShadow />
  );
}

function TurbineGenerator() {
  const m = getPlantMaterials();
  const { hp, lp, generator } = TRAIN;

  return (
    <>
      <group name={PLANT_IDS.turbine} userData={meta(PLANT_IDS.turbine, 'educational-approximation')}>
        <Box name="turbine.hp.plinth" x={[hp.x[0] + 1, hp.x[1] - 1]} y={[TB.deck.top, TB.shaftY - hp.radius + 0.3]} z={[-1.6, 1.6]} material={m.concreteDark} />
        <Casing name="turbine.hp" x={hp.x} radius={hp.radius} material={m.steel} />
        {lp.map((l, i) => (
          <Casing key={i} name={`turbine.lp${i + 1}`} x={l.x} radius={l.radius} material={m.steel} />
        ))}
        <Casing name="turbine.shaft" x={[hp.x[0] - 0.5, generator.x[1] + 3]} radius={0.4} material={m.steel} />
        {/* Stage 7: the shaft couplings turn while the plant operates; the casings stay still. */}
        <ShaftCouplings part="turbine" />
      </group>
      <group name={PLANT_IDS.generator} userData={meta(PLANT_IDS.generator, 'educational-approximation')}>
        <Casing name="generator.stator" x={generator.x} radius={generator.radius} material={m.paintedEquipment} />
        <Casing name="generator.exciter" x={[generator.x[1] + 0.5, generator.x[1] + 3]} radius={1.2} material={m.paintedEquipment} />
        <ShaftCouplings part="generator" />
      </group>
    </>
  );
}
