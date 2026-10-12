/**
 * The one place the reveal reaches the renderer: every frame, after the animation clock and
 * the camera have advanced, apply the current reveal (or the Stage 2 section review) to the
 * section planes, layer uniforms and interior visibility.
 */
import { useFrame } from '@react-three/fiber';
import { useLayoutEffect } from 'react';
import { heroReveal } from '../../animation/heroReveal';
import { useAppStore, useQualityPreset } from '../../state/store';
import { sectionedMaterials } from '../plant/materials';
import { applyReveal, setSectionCapDetail } from './sectionLayers';

const currentReveal = () => (useAppStore.getState().sectionReview ? null : heroReveal);

export function RevealDriver() {
  const { antialias, sectionCapDetail } = useQualityPreset();

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
  useFrame(() => applyReveal(currentReveal()), -90);

  return null;
}
