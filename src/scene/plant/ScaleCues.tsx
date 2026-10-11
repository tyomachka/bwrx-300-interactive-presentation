/**
 * Unobtrusive scale cues: 1.8 m people and a 16.5 m articulated truck at the loading
 * door. Too small to clutter the hero shot; readable in close and section views.
 */
import { CapsuleGeometry } from 'three';
import { REACTOR_BUILDING as RB, SITE, TURBINE_BUILDING as TB } from './dimensions';
import { meta, PLANT_IDS } from './ids';
import { getPlantMaterials } from './materials';
import { Box } from './primitives';
import { FrontOfSection, Interior } from './section';

const HUMAN_HEIGHT = 1.8;
const HUMAN_RADIUS = 0.25;
const HUMAN = new CapsuleGeometry(HUMAN_RADIUS, HUMAN_HEIGHT - 2 * HUMAN_RADIUS, 4, 10);

function Person({ x, y, z }: { x: number; y: number; z: number }) {
  return <mesh geometry={HUMAN} material={getPlantMaterials().human} position={[x, y + HUMAN_HEIGHT / 2, z]} castShadow />;
}

export function ScaleCues() {
  const m = getPlantMaterials();
  const g = SITE.apron.top;
  const truckX = TB.door.x;
  const trailerZ: [number, number] = [TB.z[1] + 1.5, TB.z[1] + 15.1];
  const cabZ: [number, number] = [trailerZ[1] + 0.4, trailerZ[1] + 6.4];

  return (
    <group name={PLANT_IDS.scaleCues} userData={meta(PLANT_IDS.scaleCues, 'educational-approximation')}>
      {/* On the refuelling floor, behind the cut: scale against the pools in section review. */}
      <Interior>
        <Person x={-3} y={RB.refuelFloorY + RB.refuelFloorThickness} z={-9} />
      </Interior>
      <FrontOfSection>
        <Person x={4.5} y={g} z={RB.aboveGradeRadius + 3.5} />
        <Person x={truckX - 4} y={g} z={trailerZ[0] + 3} />
        <group name="scale.truck">
          <Box x={[truckX - 1.1, truckX + 1.1]} y={[g, g + 1.1]} z={[trailerZ[0] + 1, cabZ[1] - 0.5]} material={m.doorPanel} />
          <Box x={[truckX - 1.25, truckX + 1.25]} y={[g + 1.1, g + 4.0]} z={trailerZ} material={m.vehicle} />
          <Box x={[truckX - 1.25, truckX + 1.25]} y={[g + 0.6, g + 3.4]} z={cabZ} material={m.vehicle} />
        </group>
      </FrontOfSection>
    </group>
  );
}
