/**
 * Main steam path placeholder: one conceptual line from the RPV's upper nozzle region,
 * horizontally through the containment and shaft wall, into the turbine building, then
 * up to the HP turbine inlet. It follows the direct-cycle route of GD Fig 5-1 (RPV nozzle
 * -> containment penetration -> turbine building wall); the official design has two lines.
 *
 * The route itself is data in routes.ts, so Stage 7 steam flow can travel along it.
 */
import { useMemo } from 'react';
import { TubeGeometry } from 'three';
import { roundedPath } from './geometry';
import { useDisposeOnChange } from './hooks';
import { meta, PLANT_IDS } from './ids';
import { getPlantMaterials } from './materials';
import { MAIN_STEAM_CORNER, MAIN_STEAM_ROUTE } from './routes';

const PIPE_RADIUS = 0.45;

export function MainSteamPath() {
  const m = getPlantMaterials();
  const geometry = useMemo(() => new TubeGeometry(roundedPath(MAIN_STEAM_ROUTE, MAIN_STEAM_CORNER), 200, PIPE_RADIUS, 12, false), []);
  useDisposeOnChange(geometry);

  return (
    <group name={PLANT_IDS.mainSteamPath} userData={{ ...meta(PLANT_IDS.mainSteamPath, 'educational-approximation'), route: MAIN_STEAM_ROUTE }}>
      <mesh geometry={geometry} material={m.steel} castShadow />
    </group>
  );
}
