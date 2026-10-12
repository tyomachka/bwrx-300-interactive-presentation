/**
 * Subordinate power-block masses (control, radwaste, turbine maintenance): low, plain,
 * behind the cut plane. They complete the compact power-block silhouette without
 * competing with the reactor building.
 */
import { ON_GRADE, SUPPORT_BUILDINGS } from './dimensions';
import { meta, PLANT_IDS } from './ids';
import { getPlantMaterials } from './materials';
import { Box } from './primitives';

export function SupportBuildings() {
  const m = getPlantMaterials();
  const faces = [m.supportCladding, m.supportCladding, m.roofMembrane, m.supportCladding, m.supportCladding, m.supportCladding];

  return (
    <group name={PLANT_IDS.supportBuildings} userData={meta(PLANT_IDS.supportBuildings, 'educational-approximation')}>
      {SUPPORT_BUILDINGS.map((b) => (
        <group key={b.id} name={b.id}>
          <Box x={b.x} y={[ON_GRADE, b.height]} z={b.z} material={faces} />
          {/* Restrained window band on the south face. */}
          <Box
            x={[b.x[0] + 2, b.x[1] - 2]}
            y={[b.height * 0.55, b.height * 0.55 + 2.2]}
            z={[b.z[1], b.z[1] + 0.12]}
            material={m.glass}
            castShadow={false}
          />
        </group>
      ))}
    </group>
  );
}
