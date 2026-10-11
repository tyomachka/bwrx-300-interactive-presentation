/**
 * Conceptual flow routes (plain data), reused later by flow animation and camera paths.
 */
import { REACTOR_PRESSURE_VESSEL as RPV, TURBINE_BUILDING as TB, TURBINE_TRAIN } from './dimensions';

export type RoutePoint = readonly [number, number, number];

const RISER_X = 34; // inside the turbine hall, just west of the turbine deck

/** RPV upper nozzle -> containment -> shaft wall -> turbine building -> HP turbine inlet. */
export const MAIN_STEAM_ROUTE: readonly RoutePoint[] = [
  [RPV.outerRadius, RPV.steamNozzleY, 0],
  [RISER_X, RPV.steamNozzleY, 0],
  [RISER_X, TB.shaftY, 0],
  [TURBINE_TRAIN.hp.x[0], TB.shaftY, 0],
];
