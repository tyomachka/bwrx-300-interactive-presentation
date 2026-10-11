/**
 * Site ground: a 48 m deep earth block (not a thin board) whose top is the grade plane.
 * Normally only its top is visible, flush with the studio floor. In section review the
 * front half disappears and the earth cut face shows the full embedded shaft.
 */
import { useMemo } from 'react';
import { useAppStore } from '../../state/store';
import { REACTOR_BUILDING, SITE } from './dimensions';
import { createSiteHalfGeometry } from './geometry';
import { useDisposeOnChange, useHalfSegments } from './hooks';
import { meta, PLANT_IDS } from './ids';
import { getPlantMaterials } from './materials';
import { Box } from './primitives';
import { FrontOfSection } from './section';

/** Upper earth layer, notched for the shaft, reaches exactly the shaft bottom. */
const UPPER = { x: SITE.x, z: SITE.z, depth: REACTOR_BUILDING.shaftDepth };
/** Solid earth under the shaft basemat. */
const LOWER = { x: SITE.x, z: SITE.z, depth: SITE.depth - REACTOR_BUILDING.shaftDepth };
const APRON_THICKNESS = 0.4;
const APRON = { x: SITE.apron.x, z: SITE.apron.z, depth: APRON_THICKNESS };
const GRADE_LINE = { height: 0.3, depth: 0.12 };

export function SiteGround() {
  const m = getPlantMaterials();
  const segments = useHalfSegments();
  const sectionReview = useAppStore((s) => s.sectionReview);
  const notch = REACTOR_BUILDING.shaftOuterRadius;

  const earth = useMemo(
    () => ({
      upperBack: createSiteHalfGeometry('back', UPPER, notch, segments),
      upperFront: createSiteHalfGeometry('front', UPPER, notch, segments),
      lowerBack: createSiteHalfGeometry('back', LOWER, 0, 1, LOWER.depth),
      lowerFront: createSiteHalfGeometry('front', LOWER, 0, 1, LOWER.depth),
    }),
    [notch, segments],
  );
  const apronBack = useMemo(() => createSiteHalfGeometry('back', APRON, notch, segments), [notch, segments]);
  const apronFront = useMemo(() => createSiteHalfGeometry('front', APRON, notch, segments), [notch, segments]);
  useDisposeOnChange(earth.upperBack, earth.upperFront, earth.lowerBack, earth.lowerFront, apronBack, apronFront);

  const earthMaterials = [m.groundSurface, m.earth];
  const apronY = SITE.apron.top - APRON_THICKNESS;

  return (
    <group name={PLANT_IDS.siteGround} userData={meta(PLANT_IDS.siteGround, 'educational-approximation')}>
      {/* Extrusions run along local +z; the -90° X rotation stands them up from y = -depth. */}
      <mesh name="site.earth.back" geometry={earth.upperBack} material={earthMaterials} rotation-x={-Math.PI / 2} position-y={-UPPER.depth} receiveShadow />
      <mesh name="site.earthBelowShaft.back" geometry={earth.lowerBack} material={earthMaterials} rotation-x={-Math.PI / 2} position-y={-SITE.depth} receiveShadow />
      <mesh name="site.apron.back" geometry={apronBack} material={m.apron} rotation-x={-Math.PI / 2} position-y={apronY} receiveShadow />
      <FrontOfSection>
        <mesh name="site.earth.front" geometry={earth.upperFront} material={earthMaterials} rotation-x={-Math.PI / 2} position-y={-UPPER.depth} receiveShadow />
        <mesh name="site.earthBelowShaft.front" geometry={earth.lowerFront} material={earthMaterials} rotation-x={-Math.PI / 2} position-y={-SITE.depth} receiveShadow />
        <mesh name="site.apron.front" geometry={apronFront} material={m.apron} rotation-x={-Math.PI / 2} position-y={apronY} receiveShadow />
      </FrontOfSection>

      {/* Grade datum on the cut face (section review only), interrupted by the shaft. */}
      <group name="site.gradeLine" visible={sectionReview}>
        <Box x={[SITE.x[0], -notch]} y={[-GRADE_LINE.height / 2, GRADE_LINE.height / 2]} z={[0, GRADE_LINE.depth]} material={m.gradeLine} castShadow={false} receiveShadow={false} />
        <Box x={[notch, SITE.x[1]]} y={[-GRADE_LINE.height / 2, GRADE_LINE.height / 2]} z={[0, GRADE_LINE.depth]} material={m.gradeLine} castShadow={false} receiveShadow={false} />
      </group>
    </group>
  );
}
