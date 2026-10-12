/**
 * Semantic registry of the reactor pressure vessel and its internals (Stage 4).
 *
 * Every entry's `id` is also the `name` of its scene object (a group or mesh), and the object's
 * `userData.componentId` points back here, so Stage 5 can resolve a click, a label or a camera
 * focus from either side. No interaction is built yet; this is the data it will use.
 *
 * Labels follow PROJECT.md §14 (one to three words); descriptions are one plain sentence for
 * Explore mode. `source` says how the geometry is constrained (see rpvData.ts provenance).
 */
import type { CameraStateId } from '../../config/camera';

export const RPV_COMPONENT_IDS = {
  rpv: 'reactor-pressure-vessel',
  upperHead: 'rpv-upper-head',
  shell: 'rpv-shell',
  lowerHead: 'rpv-lower-head',
  mainSteamNozzle: 'main-steam-nozzle',
  controlRodDrives: 'control-rod-drives',
  core: 'reactor-core',
  fuelBundles: 'fuel-bundles',
  controlBlades: 'control-blades',
  corePlate: 'core-plate',
  topGuide: 'top-guide',
  coreShroud: 'core-shroud',
  shroudSupport: 'shroud-support',
  guideTubes: 'control-rod-guide-tubes',
  chimney: 'chimney',
  chimneyHead: 'chimney-head',
  steamSeparators: 'steam-separators',
  steamDryer: 'steam-dryer',
  downcomer: 'downcomer-region',
} as const;

export type RpvComponentId = (typeof RPV_COMPONENT_IDS)[keyof typeof RPV_COMPONENT_IDS];

export interface RpvComponentInfo {
  id: RpvComponentId;
  /** Parent in the logical hierarchy (PROJECT.md §8); the RPV's parent is the containment. */
  parent: RpvComponentId | 'containment-placeholder';
  /** Short on-screen label (1-3 words). */
  label: string;
  /** One sentence for Explore mode. */
  description: string;
  /** Camera state to focus on it (config/camera.ts). */
  focus: CameraStateId;
  /** PROJECT.md §9 importance tier. */
  tier: 1 | 2 | 3;
  source: 'official' | 'official-constrained' | 'educational-approximation';
  /** Where the official constraint comes from. */
  reference: string;
}

const C = RPV_COMPONENT_IDS;

export const RPV_COMPONENTS: Record<RpvComponentId, RpvComponentInfo> = {
  [C.rpv]: { id: C.rpv, parent: 'containment-placeholder', label: 'Reactor vessel', description: 'A 27 m tall steel pressure vessel that holds the core, the water and the steam.', focus: 'rpvExterior', tier: 1, source: 'official', reference: 'GD Rev J §3.1.1, Table 2-1' },
  [C.upperHead]: { id: C.upperHead, parent: C.rpv, label: 'Vessel head', description: 'The bolted, removable top of the vessel, lifted off for refuelling.', focus: 'rpvExterior', tier: 2, source: 'official-constrained', reference: 'GD Rev J §3.1.1, Fig 3-1, Fig 3-3' },
  [C.shell]: { id: C.shell, parent: C.rpv, label: 'Vessel shell', description: 'Forged rings and plate about 13.5 cm thick, 4.2 m inside.', focus: 'rpvExterior', tier: 2, source: 'official', reference: 'GD Rev J §3.1.1' },
  [C.lowerHead]: { id: C.lowerHead, parent: C.rpv, label: 'Bottom head', description: 'The rounded bottom of the vessel; the control rod drives enter through it.', focus: 'rpvExterior', tier: 2, source: 'official-constrained', reference: 'GD Rev J §3.2, Fig 3-1' },
  [C.mainSteamNozzle]: { id: C.mainSteamNozzle, parent: C.rpv, label: 'Steam outlet', description: 'Dry steam leaves the vessel here, through two main steam lines to the turbine.', focus: 'steamRegionCloseup', tier: 1, source: 'official-constrained', reference: 'GD Rev J §3.1.2, Fig 3-1, Fig 3-3, Fig 5-1' },
  [C.controlRodDrives]: { id: C.controlRodDrives, parent: C.rpv, label: 'Control rod drives', description: '57 fine-motion drives below the vessel move the control blades up and down.', focus: 'rpvExterior', tier: 2, source: 'official-constrained', reference: 'GD Rev J §3.2, Fig 3-1, Fig 3-7' },
  [C.core]: { id: C.core, parent: C.rpv, label: 'Reactor core', description: 'Where fission happens: 240 fuel assemblies, 3.8 m tall, cooled by water rising through them.', focus: 'coreCloseup', tier: 1, source: 'official', reference: 'GD Rev J §3.1.1, §4.1, Fig 3-6' },
  [C.fuelBundles]: { id: C.fuelBundles, parent: C.core, label: 'Fuel', description: '240 GNF2 fuel assemblies, each a 10 x 10 array of fuel rods in a metal channel.', focus: 'coreCloseup', tier: 1, source: 'official-constrained', reference: 'GD Rev J §4.2, Fig 3-6, Fig 4-1, Fig 4-2' },
  [C.controlBlades]: { id: C.controlBlades, parent: C.core, label: 'Control blades', description: '57 cross-shaped blades slide up between groups of four fuel assemblies to absorb neutrons and reduce power.', focus: 'controlBladesCloseup', tier: 1, source: 'official-constrained', reference: 'GD Rev J §3.2, §4.2, Table 2-1, Fig 3-6' },
  [C.corePlate]: { id: C.corePlate, parent: C.core, label: 'Core plate', description: 'The plate at the bottom of the core that holds the fuel supports in place.', focus: 'coreCloseup', tier: 3, source: 'educational-approximation', reference: 'GD Rev J §3.1.1.1, Fig 3-2' },
  [C.topGuide]: { id: C.topGuide, parent: C.core, label: 'Top guide', description: 'A grid over the top of the core that keeps every group of four assemblies in place.', focus: 'coreCloseup', tier: 3, source: 'educational-approximation', reference: 'GD Rev J §3.1.1.1, Fig 3-2' },
  [C.coreShroud]: { id: C.coreShroud, parent: C.rpv, label: 'Core shroud', description: 'A steel cylinder around the core that separates the rising flow from the returning water.', focus: 'coreCloseup', tier: 2, source: 'official-constrained', reference: 'GD Rev J §3.1.1.1' },
  [C.shroudSupport]: { id: C.shroudSupport, parent: C.rpv, label: 'Shroud support', description: 'A ring on legs welded to the bottom head; water flows between the legs into the core.', focus: 'coreCloseup', tier: 3, source: 'educational-approximation', reference: 'GD Rev J §3.1.1.1' },
  [C.guideTubes]: { id: C.guideTubes, parent: C.rpv, label: 'Guide tubes', description: 'Tubes below the core that guide each control blade and carry the fuel above it.', focus: 'coreCloseup', tier: 3, source: 'educational-approximation', reference: 'GD Rev J §3.1.1.1, Fig 3-1' },
  [C.chimney]: { id: C.chimney, parent: C.rpv, label: 'Chimney', description: 'A tall open cylinder above the core: the hot steam-water mixture rises through it, which drives natural circulation.', focus: 'steamRegionCloseup', tier: 1, source: 'official-constrained', reference: 'GD Rev J §3.1.1, §3.1.1.1, Fig 3-1' },
  [C.chimneyHead]: { id: C.chimneyHead, parent: C.rpv, label: 'Chimney head', description: 'The lid on the chimney that carries the steam separators.', focus: 'steamRegionCloseup', tier: 2, source: 'educational-approximation', reference: 'GD Rev J §3.1.1.1, Fig 3-1' },
  [C.steamSeparators]: { id: C.steamSeparators, parent: C.rpv, label: 'Steam separators', description: 'Fixed swirl separators that spin water out of the steam; the water falls back into the downcomer.', focus: 'steamRegionCloseup', tier: 1, source: 'official-constrained', reference: 'GD Rev J §3.1.1.1, Table 2-1, Fig 3-1' },
  [C.steamDryer]: { id: C.steamDryer, parent: C.rpv, label: 'Steam dryer', description: 'Banks of chevron vanes that catch the last droplets before the steam leaves.', focus: 'steamRegionCloseup', tier: 1, source: 'official-constrained', reference: 'GD Rev J §3.1.1.1, Table 2-1, Fig 3-1' },
  [C.downcomer]: { id: C.downcomer, parent: C.rpv, label: 'Downcomer', description: 'The ring of space between the chimney and the vessel wall, where cooler water flows back down.', focus: 'rpvCutaway', tier: 2, source: 'official-constrained', reference: 'GD Rev J §3.1.1.1' },
};
