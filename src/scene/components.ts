/**
 * The semantic component registry: the one source of truth for what a component is called, what
 * it does, where it sits in the hierarchy, where the camera looks at it, and how Explore mode
 * treats it (selection, highlight, isolation, X-ray). Stage 4 created it for the reactor vessel;
 * Stage 5 adds the plant-level components built in Stage 2 (same ids as plant/ids.ts).
 *
 * Every entry's `id` is also the `name` of its scene object (a group or mesh) and
 * `userData.componentId` points back here, so interaction code resolves a click, a label or a
 * camera focus from either side, and no other list of components exists.
 *
 * Labels follow PROJECT.md §14 (one to three words); descriptions are one plain sentence.
 * `source` says how the geometry is constrained (see rpv/rpvData.ts and plant/dimensions.ts).
 */
import type { HeroRevealState } from '../animation/heroReveal';
import type { CameraStateId } from '../config/camera';
import { PLANT_IDS } from './plant/ids';
import type { InteriorLevel } from './section/sectionLayers';

export const COMPONENT_IDS = {
  // Plant (Stage 2)
  plant: PLANT_IDS.plant,
  siteGround: PLANT_IDS.siteGround,
  reactorBuilding: PLANT_IDS.reactorBuildingAboveGrade,
  reactorShaft: PLANT_IDS.reactorBuildingShaft,
  containment: PLANT_IDS.containment,
  mainSteamPath: PLANT_IDS.mainSteamPath,
  turbineBuilding: PLANT_IDS.turbineBuilding,
  turbine: PLANT_IDS.turbine,
  generator: PLANT_IDS.generator,
  supportBuildings: PLANT_IDS.supportBuildings,
  // Reactor pressure vessel and internals (Stage 4)
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

export type ComponentId = (typeof COMPONENT_IDS)[keyof typeof COMPONENT_IDS];

export interface ComponentInfo {
  id: ComponentId;
  /** Parent in the logical hierarchy (PROJECT.md §8); null for the plant root. */
  parent: ComponentId | null;
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
  /** Picking resolves to it. False for parts that only make sense as their parent (the shell). */
  selectable: boolean;
  /** A physical part of its parent: highlighted with it (head, shell, nozzle, fuel in the core). */
  partOfParent: boolean;
  /**
   * A shell around other components. X-ray and isolation ghost it; while ghosted, the interior
   * levels listed are drawn. `window`: ghost only within this plan radius (m) of the reactor axis.
   * `openedBy`: the reveal field whose section cuts it open; once that cut is complete there is
   * nothing to see through, so it is not ghosted (cheaper, and no needless see-through clutter).
   */
  enclosure?: { interior: readonly InteriorLevel[]; window?: readonly [inner: number, outer: number]; openedBy?: keyof HeroRevealState };
  /** What must be cut open to stand at its focus pose: the plant (below grade) or the vessel too. */
  opens?: 'plant' | 'vessel';
  /** Accent tint on its cut surfaces while selected (the approved copper blade emphasis). */
  selectedCapTint?: number;
}

const C = COMPONENT_IDS;

type Entry = Omit<ComponentInfo, 'id' | 'selectable' | 'partOfParent'> & Partial<Pick<ComponentInfo, 'selectable' | 'partOfParent'>>;

const entries: Record<ComponentId, Entry> = {
  // ---- Plant ----
  [C.plant]: { parent: null, label: 'BWRX-300 plant', description: 'A 300 MW-class boiling-water reactor power station.', focus: 'plantExterior', tier: 1, source: 'official-constrained', reference: 'GD Rev J §2, §10', selectable: false },
  [C.siteGround]: { parent: C.plant, label: 'Ground', description: 'The site at grade.', focus: 'plantExterior', tier: 3, source: 'educational-approximation', reference: '-', selectable: false, enclosure: { interior: ['belowGrade'], window: [24, 46], openedBy: 'groundCut' } },
  [C.reactorBuilding]: { parent: C.plant, label: 'Reactor building', description: 'Its above-ground part holds the refuelling floor and the cooling pools; the reactor itself sits below ground.', focus: 'reactorBuildingExterior', tier: 1, source: 'educational-approximation', reference: 'GD Rev J §10, Fig 2-1', enclosure: { interior: ['building'], openedBy: 'shaftReveal' } },
  [C.reactorShaft]: { parent: C.plant, label: 'Reactor shaft', description: 'The reactor building continues about 36 m underground, a cylinder set into a vertical shaft.', focus: 'stage3BelowGrade', tier: 2, source: 'official-constrained', reference: 'NEDO-34163 §1.6, GD Rev J §10', enclosure: { interior: ['building'], openedBy: 'shaftReveal' }, opens: 'plant' },
  [C.containment]: { parent: C.reactorShaft, label: 'Containment', description: 'A sealed steel-plate composite vessel around the reactor: the last barrier against any release.', focus: 'stage3Containment', tier: 1, source: 'official-constrained', reference: 'GD Rev J §3.4, Fig 3-9', enclosure: { interior: ['vessel', 'steamPath'], openedBy: 'containmentReveal' }, opens: 'plant' },
  [C.mainSteamPath]: { parent: C.plant, label: 'Main steam line', description: 'Carries the dry steam from the reactor vessel to the turbine.', focus: 'turbineRelationship', tier: 1, source: 'educational-approximation', reference: 'GD Rev J §3.1.2, Fig 5-1' },
  [C.turbineBuilding]: { parent: C.plant, label: 'Turbine hall', description: 'Houses the turbine, the generator and the condenser.', focus: 'turbineHallExterior', tier: 2, source: 'educational-approximation', reference: 'GD Rev J §5, §10', enclosure: { interior: ['turbineHall', 'steamPath'] } },
  [C.turbine]: { parent: C.turbineBuilding, label: 'Turbine', description: 'The steam expands through high- and low-pressure stages and spins the shaft.', focus: 'turbineTrain', tier: 1, source: 'educational-approximation', reference: 'GD Rev J §5.1.2' },
  [C.generator]: { parent: C.turbineBuilding, label: 'Generator', description: 'Turned by the turbine shaft, it converts the motion into electricity.', focus: 'turbineTrain', tier: 1, source: 'educational-approximation', reference: 'GD Rev J §5.1.2' },
  [C.supportBuildings]: { parent: C.plant, label: 'Support buildings', description: 'Control, waste-processing and maintenance buildings around the power block.', focus: 'plantExterior', tier: 3, source: 'educational-approximation', reference: 'GD Rev J §10' },

  // ---- Reactor pressure vessel (Stage 4) ----
  [C.rpv]: { parent: C.containment, label: 'Reactor vessel', description: 'A 27 m tall steel pressure vessel that holds the core, the water and the steam.', focus: 'rpvExterior', tier: 1, source: 'official', reference: 'GD Rev J §3.1.1, Table 2-1', enclosure: { interior: ['reactor'], openedBy: 'vesselCut' }, opens: 'plant' },
  [C.upperHead]: { parent: C.rpv, label: 'Vessel head', description: 'The bolted, removable top of the vessel, lifted off for refuelling.', focus: 'rpvExterior', tier: 2, source: 'official-constrained', reference: 'GD Rev J §3.1.1, Fig 3-1, Fig 3-3', selectable: false, partOfParent: true, opens: 'plant' },
  [C.shell]: { parent: C.rpv, label: 'Vessel shell', description: 'Forged rings and plate about 13.5 cm thick, 4.2 m inside.', focus: 'rpvExterior', tier: 2, source: 'official', reference: 'GD Rev J §3.1.1', selectable: false, partOfParent: true, opens: 'plant' },
  [C.lowerHead]: { parent: C.rpv, label: 'Bottom head', description: 'The rounded bottom of the vessel; the control rod drives enter through it.', focus: 'rpvExterior', tier: 2, source: 'official-constrained', reference: 'GD Rev J §3.2, Fig 3-1', selectable: false, partOfParent: true, opens: 'plant' },
  [C.mainSteamNozzle]: { parent: C.rpv, label: 'Steam outlet', description: 'Dry steam leaves the vessel here, through two main steam lines to the turbine.', focus: 'steamRegionCloseup', tier: 1, source: 'official-constrained', reference: 'GD Rev J §3.1.2, Fig 3-1, Fig 3-3, Fig 5-1', partOfParent: true, opens: 'plant' },
  [C.controlRodDrives]: { parent: C.rpv, label: 'Control rod drives', description: '57 fine-motion drives below the vessel move the control blades up and down.', focus: 'rpvExterior', tier: 2, source: 'official-constrained', reference: 'GD Rev J §3.2, Fig 3-1, Fig 3-7', partOfParent: true, opens: 'plant' },
  [C.core]: { parent: C.rpv, label: 'Reactor core', description: 'Where fission happens: 240 fuel assemblies, 3.8 m tall, cooled by water rising through them.', focus: 'coreCloseup', tier: 1, source: 'official', reference: 'GD Rev J §3.1.1, §4.1, Fig 3-6', opens: 'vessel' },
  [C.fuelBundles]: { parent: C.core, label: 'Fuel', description: '240 GNF2 fuel assemblies, each a 10 x 10 array of fuel rods in a metal channel.', focus: 'coreCloseup', tier: 1, source: 'official-constrained', reference: 'GD Rev J §4.2, Fig 3-6, Fig 4-1, Fig 4-2', partOfParent: true, opens: 'vessel' },
  [C.controlBlades]: { parent: C.core, label: 'Control blades', description: '57 cross-shaped blades slide up between groups of four fuel assemblies to absorb neutrons and reduce power.', focus: 'controlBladesCloseup', tier: 1, source: 'official-constrained', reference: 'GD Rev J §3.2, §4.2, Table 2-1, Fig 3-6', partOfParent: true, opens: 'vessel', selectedCapTint: 0.3 },
  [C.corePlate]: { parent: C.core, label: 'Core plate', description: 'The plate at the bottom of the core that holds the fuel supports in place.', focus: 'coreCloseup', tier: 3, source: 'educational-approximation', reference: 'GD Rev J §3.1.1.1, Fig 3-2', partOfParent: true, opens: 'vessel' },
  [C.topGuide]: { parent: C.core, label: 'Top guide', description: 'A grid over the top of the core that keeps every group of four assemblies in place.', focus: 'coreCloseup', tier: 3, source: 'educational-approximation', reference: 'GD Rev J §3.1.1.1, Fig 3-2', partOfParent: true, opens: 'vessel' },
  [C.coreShroud]: { parent: C.rpv, label: 'Core shroud', description: 'A steel cylinder around the core that separates the rising flow from the returning water.', focus: 'coreCloseup', tier: 2, source: 'official-constrained', reference: 'GD Rev J §3.1.1.1', opens: 'vessel' },
  [C.shroudSupport]: { parent: C.rpv, label: 'Shroud support', description: 'A ring on legs welded to the bottom head; water flows between the legs into the core.', focus: 'coreCloseup', tier: 3, source: 'educational-approximation', reference: 'GD Rev J §3.1.1.1', opens: 'vessel' },
  [C.guideTubes]: { parent: C.rpv, label: 'Guide tubes', description: 'Tubes below the core that guide each control blade and carry the fuel above it.', focus: 'coreCloseup', tier: 3, source: 'educational-approximation', reference: 'GD Rev J §3.1.1.1, Fig 3-1', opens: 'vessel' },
  [C.chimney]: { parent: C.rpv, label: 'Chimney', description: 'A tall open cylinder above the core: the hot steam-water mixture rises through it, which drives natural circulation.', focus: 'steamRegionCloseup', tier: 1, source: 'official-constrained', reference: 'GD Rev J §3.1.1, §3.1.1.1, Fig 3-1', opens: 'vessel' },
  [C.chimneyHead]: { parent: C.rpv, label: 'Chimney head', description: 'The lid on the chimney that carries the steam separators.', focus: 'steamRegionCloseup', tier: 2, source: 'educational-approximation', reference: 'GD Rev J §3.1.1.1, Fig 3-1', opens: 'vessel' },
  [C.steamSeparators]: { parent: C.rpv, label: 'Steam separators', description: 'Fixed swirl separators that spin water out of the steam; the water falls back into the downcomer.', focus: 'steamRegionCloseup', tier: 1, source: 'official-constrained', reference: 'GD Rev J §3.1.1.1, Table 2-1, Fig 3-1', opens: 'vessel' },
  [C.steamDryer]: { parent: C.rpv, label: 'Steam dryer', description: 'Banks of chevron vanes that catch the last droplets before the steam leaves.', focus: 'steamRegionCloseup', tier: 1, source: 'official-constrained', reference: 'GD Rev J §3.1.1.1, Table 2-1, Fig 3-1', opens: 'vessel' },
  [C.downcomer]: { parent: C.rpv, label: 'Downcomer', description: 'The ring of space between the chimney and the vessel wall, where cooler water flows back down.', focus: 'rpvCutaway', tier: 2, source: 'official-constrained', reference: 'GD Rev J §3.1.1.1', opens: 'vessel' },
};

export const COMPONENTS: Readonly<Record<ComponentId, ComponentInfo>> = Object.fromEntries(
  Object.entries(entries).map(([id, e]) => [id, { selectable: true, partOfParent: false, ...e, id: id as ComponentId }]),
) as Record<ComponentId, ComponentInfo>;

export const isComponentId = (value: unknown): value is ComponentId => typeof value === 'string' && value in COMPONENTS;

/** The component and its ancestors, nearest first. */
export function ancestry(id: ComponentId): ComponentInfo[] {
  const out: ComponentInfo[] = [];
  for (let c: ComponentInfo | undefined = COMPONENTS[id]; c; c = c.parent ? COMPONENTS[c.parent] : undefined) out.push(c);
  return out;
}

export function isDescendantOf(id: ComponentId, ancestor: ComponentId): boolean {
  return ancestry(id).some((c) => c.id === ancestor);
}

/** The component a pick on `id` selects: itself, or the nearest selectable ancestor. */
export function selectableFor(id: ComponentId): ComponentId | null {
  return ancestry(id).find((c) => c.selectable)?.id ?? null;
}

/** The nearest selectable ancestor, for "part of ..." navigation. */
export function selectableParent(id: ComponentId): ComponentId | null {
  const parent = COMPONENTS[id].parent;
  return parent ? selectableFor(parent) : null;
}
