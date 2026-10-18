/**
 * Presentation v1 in the canvas: the talk driver and every talk-only 3D element.
 *
 * Everything here draws nothing while the talk does not show it (visible = false), sits outside
 * the plant hierarchy (picking and highlighting never see it) and is mounted with the plant, so the
 * ready gate compiles its shaders up front. The 48 s cinematic never shows any of it.
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Shape, ShapeGeometry, Vector3, type Fog, type Material, type Mesh, type MeshStandardMaterial, type Object3D } from 'three';
import { COMPONENT_IDS } from '../../scene/components';
import { SITE } from '../../scene/plant/dimensions';
import { getPlantMaterials } from '../../scene/plant/materials';
import { requestShadowUpdate } from '../../scene/section/sectionLayers';
import { evaluateTalkFrame } from '../runtime';
import { updateOverlay } from '../overlayLayer';
import { talk } from '../talk';
import { world } from '../world';
import { GRADE_MARKERS, groundOwner } from './groundOwner';
import { FissionField } from './FissionField';
import { WaterCycle } from './WaterCycle';
import { GridCity } from './GridCity';
import { Comparison } from './Comparison';
import { Maps } from './Maps';
import { Footprint } from './Footprint';
import { LimitsCues } from './LimitsCues';

/** The talk's per-frame evaluation: after the clock and camera (-100), before the effects' drivers (-95). */
function TalkDriver() {
  const scene = useThree((s) => s.scene);
  useFrame(() => {
    if (talk.active) {
      talk.update(); // a stop's automatic continuations, at their scheduled moments
      evaluateTalkFrame();
    }
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
 *    turbines are shown (y.show);
 *  - the plant scales about the reactor axis on the map moves (p.zoom), with its contact shadow,
 *    standing on the filled ground instead of its earth block while scaled.
 * Found once by name; restored exactly when the talk leaves them at rest.
 */
/** Emissive intensity of each glazing material as the plant built it (Explore binds clones later). */
const glazingBase = new WeakMap<Material, number>();

const _marker = new Vector3();

/** The plant counts as scaled (stands on the filler) below this scale. */
const FULL_SIZE = 0.9999;

function PlantSwitches() {
  const scene = useThree((s) => s.scene);
  const found = useRef<{ glazing: Mesh[]; deck: Mesh; plant: Object3D; earth: Object3D[]; filler: Object3D | null; shadow: { object: Object3D; base: Vector3 } | null } | null>(null);
  const applied = useRef(false);

  useEffect(() => () => void (found.current = null), [scene]);

  useFrame(() => {
    if (!found.current) {
      const glazing: Mesh[] = [];
      const earth: Object3D[] = [];
      let deck: Mesh | null = null;
      scene.traverse((o) => {
        if (o.name === 'tb.turbineDeck') deck = o as Mesh;
        if (o.name === 'tb.glazing.north' || o.name === 'tb.glazing.south') glazing.push(o as Mesh);
        if (o.name === 'site.earth' || o.name === 'site.earthBelowShaft') earth.push(o);
      });
      const plant = scene.getObjectByName(COMPONENT_IDS.plant);
      if (!deck || !plant) return; // the plant is not mounted yet
      const contact = scene.getObjectByName('env.contactShadows'); // Low only
      const filler = scene.getObjectByName('talk-ground-filler') ?? null;
      found.current = { glazing, deck, plant, earth, filler, shadow: contact ? { object: contact, base: contact.position.clone() } : null };
      // A rebuilt scene starts with its own defaults: apply the ground owner below whatever it was.
      applied.current = false;
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
    // Map transitions: the plant shrinks into its point on the table (about the reactor axis); its
    // baked contact shadow shrinks with it (it would otherwise stay behind, full size, on empty ground).
    // Scaled about the plant's own origin, which is on grade at the reactor axis: every above-grade
    // part stays on grade at any scale (never a vertical move).
    const scale = Math.pow(10, world['p.zoom']);
    const scaled = talk.active && scale < FULL_SIZE;
    groundOwner.scale = scale;
    if (groundOwner.scaled !== scaled || !applied.current) {
      applied.current = true;
      // Scaled down, the plant stands on the filled ground (GroundFiller): its own 48 m earth block would
      // read as a plinth. At full size the block is back, the same surface where the filler was. Both
      // switch here, in the same frame.
      groundOwner.scaled = scaled;
      for (const o of f.earth) o.visible = !scaled;
      if (f.filler) f.filler.visible = scaled;
      groundOwner.earthVisible = f.earth.length > 0 && f.earth.every((o) => o.visible);
      groundOwner.fillerVisible = !!f.filler?.visible;
      requestShadowUpdate();
    }
    if (f.plant.scale.x !== scale) {
      f.plant.scale.setScalar(scale);
      f.plant.visible = scale > 0.004;
      if (f.shadow) {
        f.shadow.object.scale.setScalar(scale);
        f.shadow.object.position.copy(f.shadow.base).multiplyScalar(scale);
        f.shadow.object.visible = scale > 0.004;
      }
      requestShadowUpdate();
    }
    if (talk.active) {
      f.plant.updateMatrixWorld();
      let err = 0;
      for (const m of GRADE_MARKERS) err = Math.max(err, Math.abs(_marker.copy(m).applyMatrix4(f.plant.matrixWorld).y));
      groundOwner.gradeError = err;
    }
  }, -96);
  return null;
}

/**
 * The studio floor has a hole exactly where the site's earth block is (scene/StudioEnvironment.tsx).
 * While the plant is scaled down into a map point, that hole would show the void under it, with the
 * shrinking 48 m earth block floating in it like a plinth. This fills it with the floor's own surface
 * (same material and shape coordinates, so the light pool runs on seamlessly), a little below grade
 * so the shrunk site's top stays in front; it exists only while the plant is scaled (no cut is open
 * then, so nothing sees it from inside the earth).
 */
function GroundFiller() {
  const geometry = useMemo(() => {
    const shape = new Shape();
    // Shape space (x, y) becomes world (x, -z) after the -90° X rotation, as the floor's hole.
    shape.moveTo(SITE.x[0], -SITE.z[1]);
    shape.lineTo(SITE.x[1], -SITE.z[1]);
    shape.lineTo(SITE.x[1], -SITE.z[0]);
    shape.lineTo(SITE.x[0], -SITE.z[0]);
    shape.closePath();
    return new ShapeGeometry(shape, 1);
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  // Its visibility is switched by PlantSwitches together with the earth block (groundOwner).
  return <mesh name="talk-ground-filler" geometry={geometry} material={getPlantMaterials().groundSurface} rotation-x={-Math.PI / 2} position-y={-0.05} visible={false} receiveShadow />;
}

export function TalkScene() {
  return (
    <>
      <TalkDriver />
      <PlantSwitches />
      <GroundFiller />
      <FissionField />
      <WaterCycle />
      <GridCity />
      <Comparison />
      <Maps />
      <Footprint />
      <LimitsCues />
      <OverlayDriver />
    </>
  );
}
