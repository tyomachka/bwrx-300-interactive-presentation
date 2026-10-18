/**
 * Site ground: a 48 m deep earth block (not a thin board) whose top is the grade plane.
 * Normally only its top is visible, flush with the studio floor. The hero reveal cuts an
 * excavation into it in front of the reactor building (scene/section/sectionLayers.ts);
 * the Stage 2 section review cuts away its whole front half. The cut surface, strata and
 * the accent grade datum are drawn by the section shader.
 */
import { useMemo } from 'react';
import { RADIAL_SEGMENTS } from '../../config/quality';
import { useQualityPreset } from '../../state/store';
import { REACTOR_BUILDING, SITE } from './dimensions';
import { createSiteGeometry, SECTION_INSET } from './geometry';
import { useDisposeOnChange } from './hooks';
import { meta, PLANT_IDS } from './ids';
import { getSectionMaterials } from './materials';

/** Upper earth layer, holed for the shaft, down to the shaft bottom. */
const UPPER = { x: SITE.x, z: SITE.z, depth: REACTOR_BUILDING.shaftDepth - SECTION_INSET };
/** Solid earth under the shaft basemat (kept clear of the layer above by the section inset). */
const LOWER = { x: SITE.x, z: SITE.z, depth: SITE.depth - REACTOR_BUILDING.shaftDepth - SECTION_INSET };
/** Paved apron: sits on grade (not in it), so the two never share a face when cut. */
const APRON = { x: SITE.apron.x, z: SITE.apron.z, depth: SITE.apron.top - SECTION_INSET };

export function SiteGround() {
  const m = getSectionMaterials().ground;
  // ExtrudeGeometry draws arcs with 2 x curveSegments points: this matches the shaft's tessellation.
  const curveSegments = RADIAL_SEGMENTS[useQualityPreset().geometryLod] / 2;
  const hole = REACTOR_BUILDING.shaftOuterRadius + SECTION_INSET;

  const geometries = useMemo(
    () => ({
      upper: createSiteGeometry(UPPER, hole, curveSegments),
      lower: createSiteGeometry(LOWER, 0, 1),
      apron: createSiteGeometry(APRON, hole, curveSegments),
    }),
    [hole, curveSegments],
  );
  useDisposeOnChange(geometries.upper, geometries.lower, geometries.apron);

  const earthMaterials = [m.surface, m.earth];

  return (
    <group name={PLANT_IDS.siteGround} userData={meta(PLANT_IDS.siteGround, 'educational-approximation')}>
      {/* Extrusions run along local +z; the -90° X rotation stands them up from y = -depth. */}
      <mesh name="site.earth" geometry={geometries.upper} material={earthMaterials} rotation-x={-Math.PI / 2} position-y={-UPPER.depth} receiveShadow />
      {/* Its top is the excavation floor the shaft stands on: earth, not ground surface. Its own
          material yields in depth to the earth and basemat 1 cm above it (materials.ts earthBelowShaft). */}
      <mesh name="site.earthBelowShaft" geometry={geometries.lower} material={m.earthBelowShaft} rotation-x={-Math.PI / 2} position-y={-SITE.depth} receiveShadow />
      <mesh name="site.apron" geometry={geometries.apron} material={m.apron} rotation-x={-Math.PI / 2} position-y={SECTION_INSET} receiveShadow />
    </group>
  );
}
