/**
 * The talk's two map tables and how geographic coordinates land on them.
 *
 * Both tables lie on the ground AT THE PLANT: the plant shrinks into its point on the map while
 * the map opens around it (and grows back out of it), so plant <-> map transitions are one camera
 * move with no cut. North is -z and east is +x.
 *  - Lithuania: local equirectangular, 0.75 m per km, the grid node the plant becomes at the origin
 *    (a generic point in central Lithuania; not a site claim).
 *  - North Atlantic: Lambert azimuthal equal-area around 52°N 35°W, 165 m per Earth radius, the
 *    Darlington project at the origin (the plant shrinks into the project that is being built).
 * presentation/data/geo.ts holds the outlines in exactly these coordinates (generated).
 */
import type { Vec3Tuple } from '../../config/camera';

const RAD = Math.PI / 180;
const EARTH_KM = 6371;

/** Lithuania table: the projection centre is the grid node at the origin. */
export const LT_MAP = { lon0: 24.0, lat0: 55.25, metresPerKm: 0.75 } as const;

export function ltToWorld(lon: number, lat: number, y = 0): Vec3Tuple {
  const xKm = (lon - LT_MAP.lon0) * Math.cos(LT_MAP.lat0 * RAD) * RAD * EARTH_KM;
  const yKm = (lat - LT_MAP.lat0) * RAD * EARTH_KM;
  return [xKm * LT_MAP.metresPerKm, y, -yKm * LT_MAP.metresPerKm];
}

/** North Atlantic table: Lambert azimuthal equal-area; `scale` metres per Earth radius. */
export const WORLD_MAP = { lon0: -35, lat0: 52, scale: 165, origin: { lon: -78.72, lat: 43.873 } } as const;

function laea(lon: number, lat: number): [number, number] {
  const phi = lat * RAD;
  const dLambda = (lon - WORLD_MAP.lon0) * RAD;
  const phi0 = WORLD_MAP.lat0 * RAD;
  const k = Math.sqrt(2 / (1 + Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(dLambda)));
  return [k * Math.cos(phi) * Math.sin(dLambda), k * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(dLambda))];
}

const [OX, OY] = laea(WORLD_MAP.origin.lon, WORLD_MAP.origin.lat);

export function worldToMap(lon: number, lat: number, y = 0): Vec3Tuple {
  const [x, yy] = laea(lon, lat);
  return [(x - OX) * WORLD_MAP.scale, y, -(yy - OY) * WORLD_MAP.scale];
}

/** BWRX-300 projects on the world table (status per presentation/sources.ts). */
export type ProjectStatus = 'building' | 'licensing' | 'planned' | 'assessing';

export const PROJECT_PINS = [
  { id: 'darlington', lon: -78.72, lat: 43.873, status: 'building' },
  { id: 'clinch', lon: -84.38, lat: 35.89, status: 'licensing' },
  { id: 'poland', lon: 19.07, lat: 52.65, status: 'licensing' },
  // Estonia and Lithuania have no site: the pin marks the country, not a plant.
  { id: 'estonia', lon: 25.6, lat: 58.75, status: 'planned' },
  { id: 'lithuania', lon: 23.95, lat: 55.25, status: 'assessing' },
] as const satisfies readonly { id: string; lon: number; lat: number; status: ProjectStatus }[];

export type ProjectPinId = (typeof PROJECT_PINS)[number]['id'];

export const pinPosition = (id: ProjectPinId, y = 0): Vec3Tuple => {
  const pin = PROJECT_PINS.find((p) => p.id === id)!;
  return worldToMap(pin.lon, pin.lat, y);
};

/** Lithuanian cities (the load) with a population weight for the light size. */
export const LT_CITIES = [
  { name: 'Vilnius', lon: 25.28, lat: 54.687, weight: 1 },
  { name: 'Kaunas', lon: 23.903, lat: 54.899, weight: 0.7 },
  { name: 'Klaipėda', lon: 21.144, lat: 55.703, weight: 0.5 },
  { name: 'Šiauliai', lon: 23.314, lat: 55.934, weight: 0.38 },
  { name: 'Panevėžys', lon: 24.357, lat: 55.734, weight: 0.35 },
  { name: 'Alytus', lon: 24.046, lat: 54.396, weight: 0.25 },
  { name: 'Marijampolė', lon: 23.354, lat: 54.556, weight: 0.22 },
  { name: 'Mažeikiai', lon: 22.33, lat: 56.31, weight: 0.18 },
  { name: 'Utena', lon: 25.599, lat: 55.497, weight: 0.17 },
] as const;

/**
 * [ILLUSTRATIVE] Wind on the west of the country, solar spread across it: where the generation
 * mostly is, not real plant locations (nothing is labelled).
 */
export const LT_WIND = [
  [21.42, 55.36], [21.62, 55.22], [21.9, 55.14], [22.25, 55.27], [22.5, 55.16], [22.78, 55.07],
  [21.25, 55.88], [21.55, 55.95], [21.86, 55.9], [22.24, 55.99], [22.35, 56.28], [22.72, 56.22],
  [22.95, 55.64], [23.2, 55.78], [22.62, 55.55], [22.05, 55.6], [21.3, 55.62], [23.5, 55.85],
] as const;

export const LT_SOLAR = [
  [25.05, 54.58], [24.25, 54.78], [24.15, 54.42], [23.55, 54.6], [24.55, 55.68],
  [25.45, 55.42], [23.85, 55.3], [24.6, 55.05], [25.65, 54.95], [23.05, 54.95],
] as const;

/** [ILLUSTRATIVE] Interconnections the imports arrive by: Sweden (sea cable), Poland, Latvia. */
export const LT_INTERCONNECTORS = [
  { from: [15.95, 56.65], to: [21.14, 55.7] },
  { from: [22.36, 53.83], to: [24.05, 54.4] },
  { from: [24.15, 56.95], to: [24.36, 55.73] },
  { from: [23.2, 56.85], to: [23.31, 55.93] },
] as const;

/** Domestic lines: generation areas to the cities. */
export const LT_LINES = [
  [[21.6, 55.3], [21.14, 55.7]],
  [[21.6, 55.3], [22.3, 55.25], [23.0, 55.1], [23.9, 54.9]],
  [[22.3, 56.25], [23.31, 55.93]],
  [[22.95, 55.64], [23.31, 55.93], [24.36, 55.73]],
  [[23.9, 54.9], [24.6, 54.8], [25.28, 54.69]],
  [[24.36, 55.73], [24.6, 55.3], [25.28, 54.69]],
  [[24.05, 54.4], [24.6, 54.55], [25.28, 54.69]],
  [[23.35, 54.56], [23.9, 54.9]],
  [[25.6, 55.5], [25.28, 54.69]],
] as const;
