/**
 * Conceptual flow routes (plain data), reused later by flow animation and camera paths.
 */
import { NOZZLES } from '../rpv/rpvData';
import { REACTOR_PRESSURE_VESSEL as RPV, TURBINE_BUILDING as TB, TURBINE_TRAIN } from './dimensions';

export type RoutePoint = readonly [number, number, number];

const RISER_X = 34; // inside the turbine hall, just west of the turbine deck

/** The east main steam nozzle's flange face (scene/rpv: two nozzles, 15° off the x axis). */
const nozzleAngle = (NOZZLES.mainSteam.azimuthDeg[0] * Math.PI) / 180;
const nozzleReach = RPV.outerRadius + NOZZLES.mainSteam.length;

/** Corner radius of the main steam line's bends (m). */
export const MAIN_STEAM_CORNER = 2.5;

/** RPV main steam nozzle -> containment -> shaft wall -> turbine building -> HP turbine inlet. */
export const MAIN_STEAM_ROUTE: readonly RoutePoint[] = [
  [nozzleReach * Math.cos(nozzleAngle), RPV.steamNozzleY, nozzleReach * Math.sin(nozzleAngle)],
  [RISER_X, RPV.steamNozzleY, 0],
  [RISER_X, TB.shaftY, 0],
  [TURBINE_TRAIN.hp.x[0], TB.shaftY, 0],
];

const GENERATOR_X = (TURBINE_TRAIN.generator.x[0] + TURBINE_TRAIN.generator.x[1]) / 2;
const BUS_Y = 18.4; // just above the generator and exciter

/**
 * [APPROX] Electricity leaving the generator towards the grid (Stage 7): up from the generator,
 * east along the hall and out through its end wall, fading towards the grid. No transformer or
 * switchyard is modelled; the direction is the message.
 */
export const ELECTRICITY_ROUTE: readonly RoutePoint[] = [
  [GENERATOR_X, TB.shaftY + TURBINE_TRAIN.generator.radius + 0.05, 0],
  [GENERATOR_X, BUS_Y, 0],
  [TB.x[1] - 2, BUS_Y, 0],
  [TB.x[1] + 10, BUS_Y, 2],
  [TB.x[1] + 22, BUS_Y, 8],
];
