/**
 * Stage 2 plant massing root (PROJECT.md §8 hierarchy, simplified):
 *   site-ground, reactor building (shaft -> containment -> RPV, above-grade superstructure),
 *   main steam path, turbine building (turbine, generator), support buildings, scale cues.
 */
import { MainSteamPath } from './MainSteamPath';
import { meta, PLANT_IDS } from './ids';
import { Interior } from './section';
import { ReactorBuilding } from './ReactorBuilding';
import { ScaleCues } from './ScaleCues';
import { SiteGround } from './SiteGround';
import { SupportBuildings } from './SupportBuildings';
import { TurbineBuilding } from './TurbineBuilding';

export function Plant() {
  return (
    <group name={PLANT_IDS.plant} userData={meta(PLANT_IDS.plant, 'official-constrained')}>
      <SiteGround />
      <ReactorBuilding />
      <Interior level="steamPath">
        <MainSteamPath />
      </Interior>
      <TurbineBuilding />
      <SupportBuildings />
      <ScaleCues />
    </group>
  );
}
