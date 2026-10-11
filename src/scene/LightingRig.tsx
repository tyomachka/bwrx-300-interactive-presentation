/**
 * Studio / architectural lighting rig (PROJECT.md §17): key, soft fill, rim.
 *
 * Only the key light casts shadows, and only when the preset allows it. The shadow
 * frustum is fitted to the current composition; Stage 2 refits it to the plant footprint.
 */
import { useQualityPreset } from '../state/store';

/** Half-size (m) of the key light's orthographic shadow frustum. */
const SHADOW_EXTENT = 42;

export function LightingRig() {
  const preset = useQualityPreset();

  return (
    <group name="lighting-rig">
      {/* Soft fill: cool sky above, dark ground bounce below. */}
      <hemisphereLight args={['#dfe5ec', '#16181b', 0.6]} />

      {/* Key: warm-neutral, high and to the front-right, defines form and shadow. */}
      <directionalLight
        name="light.key"
        color="#fff3e6"
        intensity={2.4}
        position={[45, 70, 35]}
        castShadow={preset.shadows}
        shadow-mapSize={[preset.shadowMapSize || 512, preset.shadowMapSize || 512]}
        shadow-radius={preset.shadowRadius}
        shadow-bias={-0.0003}
        shadow-normalBias={0.03}
        shadow-camera-left={-SHADOW_EXTENT}
        shadow-camera-right={SHADOW_EXTENT}
        shadow-camera-top={SHADOW_EXTENT}
        shadow-camera-bottom={-SHADOW_EXTENT}
        shadow-camera-near={10}
        shadow-camera-far={180}
      />

      {/* Rim: cool light from behind-left, separates silhouettes from the dark background. */}
      <directionalLight name="light.rim" color="#dce6f2" intensity={1.6} position={[-40, 30, -55]} />

      {/* Low fill from the camera side, so shadowed faces stay legible on a low-contrast projector. */}
      <directionalLight name="light.fill" color="#cdd6e2" intensity={0.55} position={[-20, 8, 50]} />
    </group>
  );
}
