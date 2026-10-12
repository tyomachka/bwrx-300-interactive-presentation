/**
 * Stable semantic IDs for addressable plant components (PROJECT.md §26 "Major components
 * have stable IDs"). Each is the `name` of the component's root group, so later stages can
 * find it with `scene.getObjectByName(PLANT_IDS.rpv)` for selection, X-ray or sectioning.
 */
export const PLANT_IDS = {
  plant: 'plant',
  siteGround: 'site-ground',
  reactorBuildingAboveGrade: 'reactor-building-above-grade',
  reactorBuildingShaft: 'reactor-building-shaft',
  pools: 'pools-placeholder',
  containment: 'containment-placeholder',
  /** Stage 4: the real vessel profile. All components are registered in scene/components.ts. */
  rpv: 'reactor-pressure-vessel',
  turbineBuilding: 'turbine-building',
  turbine: 'turbine-placeholder',
  generator: 'generator-placeholder',
  mainSteamPath: 'main-steam-path-placeholder',
  supportBuildings: 'support-buildings',
  scaleCues: 'scale-cues',
} as const;

export type PlantId = (typeof PLANT_IDS)[keyof typeof PLANT_IDS];

/** Metadata attached to every component root: provenance travels with the geometry. */
export interface PlantComponentMeta {
  id: PlantId;
  placeholder: boolean;
  /** 'official' = dimensions from GE Vernova Hitachi documents; otherwise an approximation. */
  source: 'official' | 'official-constrained' | 'educational-approximation';
}

export function meta(id: PlantId, source: PlantComponentMeta['source'], placeholder = true): PlantComponentMeta {
  return { id, placeholder, source };
}
