/**
 * Dark neutral "product studio" surroundings: background, fog, the studio floor around the
 * site and procedural image-based lighting.
 *
 * The floor is a large disc with a hole exactly where the site's earth block is, so the
 * two meet flush at grade and share one ground material and light pool. In section review
 * the floor hides and the site block stands as a floating architectural section model.
 *
 * Image-based lighting comes from StudioLightEnvironment (procedural, rendered once).
 * drei's <Environment> is deliberately not used: its `preset` path downloads HDRs from a
 * CDN at runtime (forbidden by PROJECT.md §20) and it bundles HDR/EXR loaders.
 */
import { ContactShadows } from '@react-three/drei';
import { useMemo } from 'react';
import { Mesh, Path, Shape, ShapeGeometry, type Group, type Material } from 'three';
import { FLOOR_RADIUS, FOG, PALETTE } from '../config/render';
import { useAppStore, useQualityPreset } from '../state/store';
import { SafeLayer } from '../app/ErrorBoundary';
import { SITE } from './plant/dimensions';
import { useDisposeOnChange } from './plant/hooks';
import { getPlantMaterials } from './plant/materials';
import { SECTION_PLANES } from './section/sectionLayers';
import { StudioLightEnvironment } from './StudioLightEnvironment';

/** Baked contact-shadow footprint (low preset): the power block plus its apron. */
const CONTACT_SHADOW = { center: [35, -8] as const, size: [190, 120] as const, height: 14 };

/** The contact-shadow plane lies on grade, so the reveal's excavation must cut it too. */
function clipWithExcavation(group: Group | null): void {
  group?.traverse((o) => {
    if (!(o instanceof Mesh) || Array.isArray(o.material)) return;
    const material = o.material as Material;
    material.clippingPlanes = SECTION_PLANES.ground;
    material.clipIntersection = true;
    material.needsUpdate = true;
  });
}

export function StudioEnvironment() {
  const preset = useQualityPreset();
  const sectionReview = useAppStore((s) => s.sectionReview);
  const floor = useMemo(() => {
    const shape = new Shape().absarc(0, 0, FLOOR_RADIUS, 0, Math.PI * 2, false);
    // Shape space (x, y) becomes world (x, -z) after the -90° X rotation.
    const hole = new Path();
    hole.moveTo(SITE.x[0], -SITE.z[1]);
    hole.lineTo(SITE.x[1], -SITE.z[1]);
    hole.lineTo(SITE.x[1], -SITE.z[0]);
    hole.lineTo(SITE.x[0], -SITE.z[0]);
    hole.closePath();
    shape.holes.push(hole);
    return new ShapeGeometry(shape, 96);
  }, []);
  useDisposeOnChange(floor);

  return (
    <>
      <color attach="background" args={[PALETTE.background]} />
      <fog attach="fog" args={[PALETTE.background, FOG.near, FOG.far]} />

      <mesh name="env.floor" geometry={floor} material={getPlantMaterials().groundSurface} rotation-x={-Math.PI / 2} visible={!sectionReview} receiveShadow />

      {/* Image-based lighting is a nice-to-have: if it fails, direct lights still carry the scene. */}
      <SafeLayer name="studio-environment">
        <StudioLightEnvironment resolution={preset.envResolution} intensity={0.9} />
      </SafeLayer>

      {preset.contactShadows && !sectionReview && (
        <SafeLayer name="contact-shadows">
          {/* Baked once: grounding for the low preset, where realtime shadow maps are off. */}
          <ContactShadows
            ref={clipWithExcavation}
            name="env.contactShadows"
            frames={1}
            position={[CONTACT_SHADOW.center[0], SITE.apron.top + 0.02, CONTACT_SHADOW.center[1]]}
            scale={[CONTACT_SHADOW.size[0], CONTACT_SHADOW.size[1]]}
            resolution={preset.contactShadowResolution}
            far={CONTACT_SHADOW.height}
            blur={2.5}
            opacity={0.8}
            color="#000000"
          />
        </SafeLayer>
      )}
    </>
  );
}
