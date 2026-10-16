/**
 * Presentation v1: the water cycle closed. The 48 s model shows steam leaving for the turbine and
 * never coming back; here (talk only) the turbine exhaust condenses and the water returns:
 *
 *   LP turbine exhaust -> condenser shell under each LP turbine -> hotwell -> condensate / feedwater
 *   pump -> feedwater line -> the RPV feedwater nozzle
 *
 * GD Rev J §5.1.2 (p. 55) "Each LP turbine exhausts directly to the main condenser connected
 * underneath each LP turbine"; §5.1.5 (p. 56-57) a single-pressure, two-shell condenser, one shell
 * beneath each LP turbine, draining to hotwells; §5.1.6 (p. 57) condensate pumps, feedwater heaters
 * and reactor feedwater pumps return the water to the RPV (presentation/sources.ts condenserLoop).
 *
 * [APPROX] Simplified for the story: one pump stands for the condensate and feedwater pumps, the
 * feedwater heaters, demineralisers and the condenser's circulating (cooling) water are left out,
 * shell and tube sizes are visual. The shells are drawn open towards the south cameras (a cutaway
 * like the rest of the plant), so the falling condensate shows. While shown, the solid turbine
 * deck gives way to a pedestal on columns (scene/TalkScene.tsx PlantSwitches), as real turbine
 * tables stand, so the shells can be seen under the LP casings.
 */
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { BoxGeometry, CylinderGeometry, MeshStandardMaterial, TubeGeometry, type BufferGeometry, type Group, type Mesh } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createPulseMaterial } from '../../scene/flow/flowMaterials';
import { TURBINE_BUILDING as TB, TURBINE_TRAIN as TRAIN } from '../../scene/plant/dimensions';
import { getPlantMaterials } from '../../scene/plant/materials';
import { NOZZLES } from '../../scene/rpv/rpvData';
import { REACTOR_PRESSURE_VESSEL as RPV } from '../../scene/plant/dimensions';
import { requestShadowUpdate } from '../../scene/section/sectionLayers';
import { useQualityPreset } from '../../state/store';
import { cue, talkClock, world } from '../world';
import { line, mergeTubes, pulseTube, route } from './pulse';

type V3 = [number, number, number];

const box = (x: [number, number], y: [number, number], z: [number, number]) =>
  new BoxGeometry(x[1] - x[0], y[1] - y[0], z[1] - z[0]).translate((x[0] + x[1]) / 2, (y[0] + y[1]) / 2, (z[0] + z[1]) / 2);

/** The two condenser shells, one under each LP turbine (x ranges), open towards +z. */
const SHELL = { y: [0.6, 9.4] as [number, number], z: [-5.4, 5.4] as [number, number], wall: 0.25, inset: 0.4 };
const shells = TRAIN.lp.map((lp) => [lp.x[0] + SHELL.inset, lp.x[1] - SHELL.inset] as [number, number]);
const LP_BOTTOM = TB.shaftY - TRAIN.lp[0]!.radius;
const HOTWELL_Y = 1.5;

/** [APPROX] Feedwater: hotwell -> pump -> riser beside the steam riser -> below grade -> RPV nozzle. */
const fwAngle = (NOZZLES.feedwater.azimuthDeg[0] * Math.PI) / 180;
const fwReach = RPV.outerRadius + NOZZLES.feedwater.length;
const FW_Y = RPV.insideBottomY + NOZZLES.feedwater.h;
const PUMP = { x: 46, z: 4.4 };
const FEEDWATER_ROUTE: readonly V3[] = [
  [61, 1.3, 4.4],
  [31.5, 1.3, 4.4],
  [31.5, FW_Y, 4.4],
  [24, FW_Y, 2.0],
  [4.6, FW_Y, 2.0],
  [fwReach * Math.cos(fwAngle), FW_Y, fwReach * Math.sin(fwAngle)],
];
const FW_RADIUS = 0.28;

const LOOK = {
  exhaust: { color: '#e8edf0', alpha: 0.55, base: 0.2, spacing: 1.6, pulse: 0.7, speed: 3.2 },
  condensate: { color: '#86b6d3', alpha: 0.8, base: 0.25, spacing: 1.2, pulse: 0.45, speed: 2.4 },
  feedwater: { color: '#5c9cc3', alpha: 0.9, base: 0.32, spacing: 3.2, pulse: 1.2, speed: 6.5 },
} as const;

function buildStatic(lod: 'high' | 'low') {
  const concrete: BufferGeometry[] = [];
  // Turbine table: slabs under the HP turbine and the generator, edge beams along the LP casings.
  const deckY: [number, number] = [TB.deck.top - 1.4, TB.deck.top];
  const lpSpan: [number, number] = [shells[0]![0] - SHELL.inset - 0.4, shells[1]![1] + SHELL.inset + 0.4];
  concrete.push(box([TB.deck.x[0], lpSpan[0]], deckY, [-TB.deck.halfWidth, TB.deck.halfWidth]));
  concrete.push(box([lpSpan[1], TB.deck.x[1]], deckY, [-TB.deck.halfWidth, TB.deck.halfWidth]));
  concrete.push(box(lpSpan, deckY, [-TB.deck.halfWidth, -5.7]));
  concrete.push(box(lpSpan, deckY, [5.7, TB.deck.halfWidth]));
  for (const x of [TB.deck.x[0] + 1.2, lpSpan[0] - 0.9, (shells[0]![1] + shells[1]![0]) / 2, lpSpan[1] + 0.9, TB.deck.x[1] - 1.2]) {
    for (const z of [-6.3, 6.3]) concrete.push(box([x - 0.65, x + 0.65], [TB.floorTop, deckY[0]], [z - 0.65, z + 0.65]));
  }

  const painted: BufferGeometry[] = [];
  const steel: BufferGeometry[] = [];
  const water: BufferGeometry[] = [];
  const w = SHELL.wall;
  const [y0, y1] = SHELL.y;
  const [z0, z1] = SHELL.z;
  const cols = lod === 'high' ? 4 : 3;
  const rows = lod === 'high' ? 6 : 4;
  for (const [x0, x1] of shells) {
    painted.push(box([x0, x1], [y0, y0 + w], [z0, z1])); // floor
    painted.push(box([x0, x1], [y1 - w, y1], [z0, z1])); // roof
    painted.push(box([x0, x1], [y0, y1], [z0, z0 + w])); // back
    painted.push(box([x0, x0 + w], [y0, y1], [z0, z1])); // ends
    painted.push(box([x1 - w, x1], [y0, y1], [z0, z1]));
    painted.push(box([x0 + 0.5, x1 - 0.5], [y1, LP_BOTTOM + 0.15], [-3, 3])); // exhaust neck
    water.push(box([x0 + w, x1 - w], [y0 + w, HOTWELL_Y], [z0 + w, z1 - 0.3]));
    // Tube bundle along the shell (cooling water inside, steam condensing on the outside).
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const z = -4.4 + (5.6 * c) / (cols - 1);
        const y = 3.2 + (4.6 * r) / (rows - 1);
        steel.push(new CylinderGeometry(0.1, 0.1, x1 - x0 - 2 * w - 0.1, 8, 1, true).rotateZ(Math.PI / 2).translate((x0 + x1) / 2, y, z));
      }
    }
  }
  // Pump (stands for the condensate and feedwater pumps) and its motor.
  painted.push(new CylinderGeometry(0.75, 0.8, 1.7, 20).translate(PUMP.x, TB.floorTop + 0.85 + 0.3, PUMP.z));
  painted.push(box([PUMP.x - 1, PUMP.x + 1], [TB.floorTop, TB.floorTop + 0.3], [PUMP.z - 1, PUMP.z + 1]));
  steel.push(new CylinderGeometry(0.55, 0.55, 1.5, 18).translate(PUMP.x, TB.floorTop + 2.6, PUMP.z));
  // The feedwater line itself.
  steel.push(new TubeGeometry(route(FEEDWATER_ROUTE, 1.4), 160, FW_RADIUS, 10, false));

  const merge = (parts: BufferGeometry[]) => {
    const g = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)), false)!;
    parts.forEach((p) => p.dispose());
    return g;
  };
  return { concrete: merge(concrete), painted: merge(painted), steel: merge(steel), water: merge(water) };
}

function buildFlow() {
  const tubes: BufferGeometry[] = [];
  const steamLen = LP_BOTTOM - 5.9;
  for (const [x0, x1] of shells) {
    const xs = [x0 + 1.6, (x0 + x1) / 2, x1 - 1.6];
    for (const x of xs) {
      tubes.push(pulseTube({ curve: line([x, LP_BOTTOM, 3.4], [x, 5.9, 3.4]), radius: 0.11, slot: 0, segments: 8, radial: 8 }));
      tubes.push(pulseTube({ curve: line([x, 5.6, 3.4], [x, HOTWELL_Y + 0.1, 3.4]), radius: 0.1, delay: steamLen + 0.3, slot: 1, segments: 8, radial: 8 }));
    }
  }
  tubes.push(pulseTube({ curve: route(FEEDWATER_ROUTE, 1.4), radius: FW_RADIUS + 0.06, delay: steamLen + 4.6, slot: 2, segments: 200, radial: 12 }));
  return { geometry: mergeTubes(tubes), material: createPulseMaterial([LOOK.exhaust, LOOK.condensate, LOOK.feedwater]) };
}

/** Total front travel (m) from the exhaust to the RPV nozzle: the `cycle` cue runs it once. */
const FRONT_TOTAL = 110;

const waterMaterial = new MeshStandardMaterial({ color: '#2f5a73', roughness: 0.25, metalness: 0.1, emissive: '#16303f', emissiveIntensity: 0.4 });

export function WaterCycle() {
  const lod = useQualityPreset().geometryLod;
  const statics = useMemo(() => buildStatic(lod), [lod]);
  const flow = useMemo(() => buildFlow(), []);
  const group = useRef<Group>(null);
  const flowMesh = useRef<Mesh>(null);
  const shown = useRef(false);
  const m = getPlantMaterials();

  useEffect(
    () => () => {
      for (const g of Object.values(statics)) g.dispose();
    },
    [statics],
  );
  useEffect(
    () => () => {
      flow.geometry.dispose();
      flow.material.dispose();
    },
    [flow],
  );

  useFrame(() => {
    const show = world['y.show'] > 0.5;
    if (group.current && group.current.visible !== show) {
      group.current.visible = show;
      requestShadowUpdate();
    }
    shown.current = show;
    if (!show) return;
    const u = flow.material.uniforms;
    const p = cue('cycle');
    const front = p >= 1 ? Infinity : p * FRONT_TOTAL;
    u.uTime.value = talkClock.time;
    u.uState.value[0]!.set(world['y.exhaust'], front, LOOK.exhaust.alpha, 0);
    u.uState.value[1]!.set(world['y.exhaust'], front, LOOK.condensate.alpha, 0);
    u.uState.value[2]!.set(world['y.feedwater'], front, LOOK.feedwater.alpha, 0);
    if (flowMesh.current) flowMesh.current.visible = world['y.exhaust'] > 0.001 || world['y.feedwater'] > 0.001;
  }, -80);

  return (
    <group ref={group} name="talk-water-cycle" visible={false}>
      <mesh name="talk-water-cycle.pedestal" geometry={statics.concrete} material={m.concreteDark} receiveShadow />
      <mesh name="talk-water-cycle.condensers" geometry={statics.painted} material={m.paintedEquipment} receiveShadow />
      <mesh name="talk-water-cycle.tubes" geometry={statics.steel} material={m.steel} receiveShadow />
      <mesh name="talk-water-cycle.hotwells" geometry={statics.water} material={waterMaterial} />
      <mesh ref={flowMesh} name="talk-water-cycle.flow" geometry={flow.geometry} material={flow.material} visible={false} />
    </group>
  );
}
