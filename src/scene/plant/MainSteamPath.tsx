/**
 * Main steam path placeholder: one conceptual line from the RPV's upper nozzle region,
 * horizontally through the containment and shaft wall, into the turbine building, then
 * up to the HP turbine inlet. It follows the direct-cycle route of GD Fig 5-1 (RPV nozzle
 * -> containment penetration -> turbine building wall); the official design has two lines.
 *
 * The route itself is data in routes.ts, so Stage 7 steam flow can travel along it.
 */
import { useMemo } from 'react';
import { CurvePath, LineCurve3, QuadraticBezierCurve3, TubeGeometry, Vector3 } from 'three';
import { useDisposeOnChange } from './hooks';
import { meta, PLANT_IDS } from './ids';
import { getPlantMaterials } from './materials';
import { MAIN_STEAM_ROUTE } from './routes';

const PIPE_RADIUS = 0.45;
const CORNER_RADIUS = 2.5;

/** Straight runs joined by rounded corners. */
function roundedPath(points: readonly (readonly [number, number, number])[], cornerRadius: number): CurvePath<Vector3> {
  const path = new CurvePath<Vector3>();
  const v = points.map((p) => new Vector3(...p));
  let start = v[0]!.clone();
  for (let i = 1; i < v.length - 1; i++) {
    const corner = v[i]!;
    const inDir = corner.clone().sub(v[i - 1]!).normalize();
    const outDir = v[i + 1]!.clone().sub(corner).normalize();
    const before = corner.clone().addScaledVector(inDir, -cornerRadius);
    const after = corner.clone().addScaledVector(outDir, cornerRadius);
    path.add(new LineCurve3(start, before));
    path.add(new QuadraticBezierCurve3(before, corner.clone(), after));
    start = after;
  }
  path.add(new LineCurve3(start, v[v.length - 1]!.clone()));
  return path;
}

export function MainSteamPath() {
  const m = getPlantMaterials();
  const geometry = useMemo(() => new TubeGeometry(roundedPath(MAIN_STEAM_ROUTE, CORNER_RADIUS), 200, PIPE_RADIUS, 12, false), []);
  useDisposeOnChange(geometry);

  return (
    <group name={PLANT_IDS.mainSteamPath} userData={{ ...meta(PLANT_IDS.mainSteamPath, 'educational-approximation'), route: MAIN_STEAM_ROUTE }}>
      <mesh geometry={geometry} material={m.steel} castShadow />
    </group>
  );
}
