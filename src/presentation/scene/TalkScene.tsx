/**
 * Presentation v1 in the canvas: the talk driver and every talk-only 3D element.
 *
 * Everything here draws nothing while the talk does not show it (visible = false), sits outside
 * the plant hierarchy (picking and highlighting never see it) and is mounted with the plant, so the
 * ready gate compiles its shaders up front. The 48 s cinematic never shows any of it.
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { Fog, Material, Mesh, MeshStandardMaterial, Object3D } from 'three';
import { COMPONENT_IDS } from '../../scene/components';
import { requestShadowUpdate } from '../../scene/section/sectionLayers';
import { evaluateTalkFrame } from '../runtime';
import { updateOverlay } from '../overlayLayer';
import { talk } from '../talk';
import { world } from '../world';
import { ChainFission } from './ChainFission';
import { WaterCycle } from './WaterCycle';
import { GridCity } from './GridCity';
import { Comparison } from './Comparison';
import { Maps } from './Maps';
import { Pitches } from './Pitches';
import { LimitsCues } from './LimitsCues';

/** The talk's per-frame evaluation: after the clock and camera (-100), before the effects' drivers (-95). */
function TalkDriver() {
  const scene = useThree((s) => s.scene);
  useFrame(() => {
    if (talk.active) evaluateTalkFrame();
    // The world rests at the studio's own fog, so this is a no-op whenever the talk is not running.
    const fog = scene.fog as Fog | null;
    if (fog) {
      fog.near = world['e.fogNear'];
      fog.far = world['e.fogFar'];
    }
  }, -97);
  return null;
}

/** Overlay placement after the camera and the effects have their frame state (-70). */
function OverlayDriver() {
  const size = useThree((s) => s.size);
  useFrame(({ camera }) => {
    if (talk.active) updateOverlay(camera, size.width, size.height);
  }, -70);
  return null;
}

/**
 * Plant-side switches the talk needs without changing the plant model:
 *  - the turbine hall's lit glazing dims in the blackout (p.lights);
 *  - the solid turbine deck gives way to the talk's pedestal while the condensers under the LP
 *    turbines are shown (y.show).
 * Found once by name; restored exactly when the talk leaves them at rest.
 */
/** Emissive intensity of each glazing material as the plant built it (Explore binds clones later). */
const glazingBase = new WeakMap<Material, number>();

function PlantSwitches() {
  const scene = useThree((s) => s.scene);
  const found = useRef<{ glazing: Mesh[]; deck: Mesh; plant: Object3D } | null>(null);

  useEffect(() => () => void (found.current = null), [scene]);

  useFrame(() => {
    if (!found.current) {
      const glazing: Mesh[] = [];
      let deck: Mesh | null = null;
      scene.traverse((o) => {
        if (o.name === 'tb.turbineDeck') deck = o as Mesh;
        if (o.name === 'tb.glazing.north' || o.name === 'tb.glazing.south') glazing.push(o as Mesh);
      });
      const plant = scene.getObjectByName(COMPONENT_IDS.plant);
      if (!deck || !plant) return; // the plant is not mounted yet
      found.current = { glazing, deck, plant };
    }
    const f = found.current;
    for (const mesh of f.glazing) {
      const material = mesh.material as MeshStandardMaterial;
      if (!material.isMeshStandardMaterial) continue;
      let base = glazingBase.get(material);
      if (base === undefined) glazingBase.set(material, (base = material.emissiveIntensity));
      const v = base * world['p.lights'];
      if (material.emissiveIntensity !== v) material.emissiveIntensity = v;
    }
    const deckVisible = world['y.show'] < 0.5;
    if (f.deck.visible !== deckVisible) f.deck.visible = deckVisible;
    // Map transitions: the plant shrinks into its point on the table (about the reactor axis).
    const scale = Math.pow(10, world['p.zoom']);
    if (f.plant.scale.x !== scale) {
      f.plant.scale.setScalar(scale);
      f.plant.visible = scale > 0.004;
      requestShadowUpdate();
    }
  }, -96);
  return null;
}

export function TalkScene() {
  return (
    <>
      <TalkDriver />
      <PlantSwitches />
      <ChainFission />
      <WaterCycle />
      <GridCity />
      <Comparison />
      <Maps />
      <Pitches />
      <LimitsCues />
      <OverlayDriver />
    </>
  );
}
