/**
 * Stage 7 outside the vessel: steam along the main steam line, steam through the turbine casings,
 * electricity leaving the generator. Pulse tubes (flowMaterials.ts) light up behind an advancing
 * front, so the line carries steam only once the steam has got there. Two draw calls: the steam
 * line sleeve (drawn with the steam line, interior level `steamPath`) and the turbine bands plus
 * the electricity path in one mesh (with the turbine hall interior). The shaft rotation is in
 * ShaftCouplings, part of the turbine-generator itself.
 *
 * Turbine steam path (GD §5.1.2): axially through the HP turbine, then (via the moisture
 * separator reheater, not modelled) into the two double-flow LP turbines, from the middle of
 * each towards both ends.
 */
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Float32BufferAttribute, LineCurve3, TubeGeometry, Vector3, type BufferGeometry, type Curve, type Mesh } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { flowForFrame } from '../../animation/operatingFlow';
import { FLOW_LOOK } from '../../config/flow';
import { TURBINE_BUILDING as TB, TURBINE_TRAIN as TRAIN } from '../plant/dimensions';
import { roundedPath } from '../plant/geometry';
import { ELECTRICITY_ROUTE, MAIN_STEAM_CORNER, MAIN_STEAM_ROUTE } from '../plant/routes';
import { Interior } from '../plant/section';
import { createPulseMaterial } from './flowMaterials';

interface TubeSpec {
  curve: Curve<Vector3>;
  radius: number;
  /** Metres the channel's front travels before this tube starts. */
  delay?: number;
  /** Fade over the last metres (a line that runs off towards the grid). */
  tail?: number;
  channel: number;
  segments?: number;
  radial?: number;
}

function pulseTube({ curve, radius, delay = 0, tail = 0, channel, segments = 64, radial = 16 }: TubeSpec): BufferGeometry {
  // `radius` is the inner radius of the polygon, so its flat faces never dip into what it wraps.
  const geometry = new TubeGeometry(curve, segments, radius / Math.cos(Math.PI / radial), radial, false);
  const length = curve.getLength();
  const n = geometry.getAttribute('position').count;
  const tube = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) tube.set([length, delay, tail, channel], i * 4);
  geometry.setAttribute('aTube', new Float32BufferAttribute(tube, 4));
  return geometry;
}

const axis = (x0: number, x1: number) => new LineCurve3(new Vector3(x0, TB.shaftY, 0), new Vector3(x1, TB.shaftY, 0));

/** Turbine casing bands: HP inlet -> exhaust, then each LP from its middle to both ends. */
function turbineBands(): BufferGeometry[] {
  const { hp, lp } = TRAIN;
  const offset = FLOW_LOOK.turbine.offset;
  // The steam reaches the LP turbines after the HP turbine and its crossover.
  const lpDelay = hp.x[1] - hp.x[0] + 3;
  return [
    pulseTube({ curve: axis(hp.x[0], hp.x[1]), radius: hp.radius + offset, channel: 0, segments: 16, radial: 64 }),
    ...lp.flatMap((l) => {
      const mid = (l.x[0] + l.x[1]) / 2;
      return [
        pulseTube({ curve: axis(mid, l.x[0]), radius: l.radius + offset, delay: lpDelay, channel: 0, segments: 12, radial: 64 }),
        pulseTube({ curve: axis(mid, l.x[1]), radius: l.radius + offset, delay: lpDelay, channel: 0, segments: 12, radial: 64 }),
      ];
    }),
  ];
}

export function PowerFlow() {
  const meshes = useMemo(() => {
    const steamLine = pulseTube({ curve: roundedPath(MAIN_STEAM_ROUTE, MAIN_STEAM_CORNER), radius: FLOW_LOOK.mainSteam.radius, channel: 0, segments: 220 });
    const electricity = pulseTube({ curve: roundedPath(ELECTRICITY_ROUTE, FLOW_LOOK.electricity.corner), radius: FLOW_LOOK.electricity.radius, tail: 10, channel: 1, segments: 160 });
    const parts = [...turbineBands(), electricity];
    const hall = mergeGeometries(parts, false);
    parts.forEach((g) => g.dispose());
    return {
      steamLine,
      steamMaterial: createPulseMaterial([FLOW_LOOK.mainSteam]),
      hall,
      hallMaterial: createPulseMaterial([FLOW_LOOK.turbine, FLOW_LOOK.electricity]),
    };
  }, []);

  const steamRef = useRef<Mesh>(null);
  const hallRef = useRef<Mesh>(null);

  useEffect(
    () => () => {
      meshes.steamLine.dispose();
      meshes.hall.dispose();
      meshes.steamMaterial.dispose();
      meshes.hallMaterial.dispose();
    },
    [meshes],
  );

  useFrame(() => {
    const flow = flowForFrame();
    const steam = meshes.steamMaterial.uniforms;
    steam.uTime.value = flow.time;
    steam.uState.value[0]!.set(flow.intensity.mainSteam, flow.mainSteamFront, FLOW_LOOK.mainSteam.alpha, 0);
    const hall = meshes.hallMaterial.uniforms;
    hall.uTime.value = flow.time;
    hall.uState.value[0]!.set(flow.intensity.turbine, flow.turbineFront, FLOW_LOOK.turbine.alpha, 0);
    hall.uState.value[1]!.set(flow.intensity.electricity, flow.electricityFront, FLOW_LOOK.electricity.alpha, 0);
    // Skipped entirely while their channels are off.
    if (steamRef.current) steamRef.current.visible = flow.intensity.mainSteam > 0.001;
    if (hallRef.current) hallRef.current.visible = flow.intensity.turbine > 0.001 || flow.intensity.electricity > 0.001;
  }, -80);

  return (
    <>
      <Interior level="steamPath">
        <mesh ref={steamRef} name="operating-flow.main-steam" geometry={meshes.steamLine} material={meshes.steamMaterial} visible={false} />
      </Interior>
      <Interior level="turbineHall">
        <mesh ref={hallRef} name="operating-flow.turbine-electricity" geometry={meshes.hall} material={meshes.hallMaterial} visible={false} />
      </Interior>
    </>
  );
}
