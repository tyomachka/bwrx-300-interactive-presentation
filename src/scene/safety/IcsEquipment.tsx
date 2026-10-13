/**
 * Stage 9: the isolation condenser hardware (scene/safety/icsLayout.ts): three ICs in their
 * pools and their steam supply and condensate return lines to the RPV, one draw call. Part of
 * the plant (drawn with the pools, interior level `pools`), so it takes the section look and the
 * context dim like the building around it; its flow is drawn by PassiveSafety.
 */
import { useMemo } from 'react';
import { useQualityPreset } from '../../state/store';
import { useDisposeOnChange } from '../plant/hooks';
import { getSectionMaterials } from '../plant/materials';
import { buildIcsHardware, ICS_EQUIPMENT_NAME } from './icsLayout';

export function IcsEquipment() {
  const radial = useQualityPreset().geometryLod === 'high' ? 16 : 10;
  const geometry = useMemo(() => buildIcsHardware(radial), [radial]);
  useDisposeOnChange(geometry);
  return (
    <mesh
      name={ICS_EQUIPMENT_NAME}
      geometry={geometry}
      material={getSectionMaterials().building.icsSteel}
      castShadow={false}
    />
  );
}
