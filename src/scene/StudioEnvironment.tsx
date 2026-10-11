/**
 * Dark neutral "product studio" surroundings: background, fog, ground and a procedural
 * image-based-lighting environment.
 *
 * Image-based lighting comes from StudioLightEnvironment (procedural, rendered once).
 * drei's <Environment> is deliberately not used: its `preset` path downloads HDRs from
 * a CDN at runtime (forbidden by PROJECT.md §20) and it bundles HDR/EXR loaders.
 */
import { ContactShadows } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { FOG, GROUND_RADIUS, PALETTE } from '../config/render';
import { useQualityPreset } from '../state/store';
import { SafeLayer } from '../app/ErrorBoundary';
import { PLINTH } from './layout';
import { StudioLightEnvironment } from './StudioLightEnvironment';

/** Radius (m) of the soft pool of light on the floor; beyond it the floor falls to black. */
const LIGHT_POOL_RADIUS = 75;

/**
 * A procedural radial falloff used as the floor's colour map: a "pool of light" around
 * the subject (PROJECT.md §5) with no spotlight cost and no texture file.
 */
function createLightPoolTexture(): CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const inner = (LIGHT_POOL_RADIUS / GROUND_RADIUS) * (size / 2);
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, inner);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.55, '#8a8a8a');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function StudioEnvironment() {
  const preset = useQualityPreset();
  const lightPool = useMemo(() => createLightPoolTexture(), []);
  useEffect(() => () => lightPool.dispose(), [lightPool]);

  return (
    <>
      <color attach="background" args={[PALETTE.background]} />
      <fog attach="fog" args={[PALETTE.background, FOG.near, FOG.far]} />

      <mesh name="env.ground" rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[GROUND_RADIUS, 64]} />
        <meshStandardMaterial color={PALETTE.ground} map={lightPool} roughness={0.95} metalness={0} envMapIntensity={0.3} />
      </mesh>

      {/* Image-based lighting is a nice-to-have: if it fails, direct lights still carry the scene. */}
      <SafeLayer name="studio-environment">
        <StudioLightEnvironment resolution={preset.envResolution} intensity={0.9} />
      </SafeLayer>

      {preset.contactShadows && (
        <SafeLayer name="contact-shadows">
          {/* Baked once: grounding for the low preset, where realtime shadow maps are off. */}
          <ContactShadows
            frames={1}
            position={[0, PLINTH.height + 0.01, 0]}
            scale={[PLINTH.width, PLINTH.depth]}
            resolution={preset.contactShadowResolution}
            far={30}
            blur={2.5}
            opacity={0.55}
            color="#000000"
          />
        </SafeLayer>
      )}
    </>
  );
}
