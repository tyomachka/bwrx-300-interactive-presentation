/**
 * The one place the reveal reaches the renderer: every frame, after the animation clock and
 * the camera have advanced, apply the current reveal (or the Stage 2 section review) to the
 * section planes, layer uniforms and interior visibility.
 *
 * It also owns shadow-map updates. The key light and every shadow caster are static; only the
 * cuts change what casts (clipped shadows, interior content). So the shadow map is re-rendered
 * on frames where a section plane moved, not on every frame: a held view (a review state, the
 * exterior, the end of the shot) skips the whole shadow pass. The result is identical.
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect } from 'react';
import { heroReveal } from '../../animation/heroReveal';
import { useAppStore, useQualityPreset } from '../../state/store';
import { sectionedMaterials } from '../plant/materials';
import { applyReveal, sectionPlanesChanged, setSectionCapDetail } from './sectionLayers';

const currentReveal = () => (useAppStore.getState().sectionReview ? null : heroReveal);

export function RevealDriver() {
  const { antialias, sectionCapDetail } = useQualityPreset();
  const gl = useThree((s) => s.gl);

  useLayoutEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => void (gl.shadowMap.autoUpdate = true);
  }, [gl]);

  // Per-canvas settings, applied before the ReadyGate compiles shaders.
  useLayoutEffect(() => {
    setSectionCapDetail(sectionCapDetail);
    for (const material of sectionedMaterials()) {
      // Antialiased clip edges need MSAA; without it alpha-to-coverage is just a hard cut.
      if (material.alphaToCoverage !== antialias) {
        material.alphaToCoverage = antialias;
        material.needsUpdate = true;
      }
    }
    applyReveal(currentReveal());
  }, [antialias, sectionCapDetail]);

  // After FrameDriver (-100): the clock and camera are current for this frame.
  useFrame(() => {
    applyReveal(currentReveal());
    if (sectionPlanesChanged()) gl.shadowMap.needsUpdate = true;
  }, -90);

  return null;
}
