/**
 * Stage 7: the turning shaft couplings of the turbine-generator train (shaftGeometry.ts). They
 * belong to the turbine and generator components (picked and highlighted with them); only they
 * rotate, never a casing. The angle is a pure function of the flow time (animation/operatingFlow.ts):
 * still until the steam reaches the turbine, slowed down for the eye.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';
import { flowForFrame } from '../../animation/operatingFlow';
import { TURBINE_BUILDING as TB } from '../plant/dimensions';
import { useDisposeOnChange, useHalfSegments } from '../plant/hooks';
import { getPlantMaterials } from '../plant/materials';
import { buildCouplings, type CouplingPart } from './shaftGeometry';

export function ShaftCouplings({ part }: { part: CouplingPart }) {
  const segments = useHalfSegments();
  const { flanges, marks } = useMemo(() => buildCouplings(part, segments), [part, segments]);
  useDisposeOnChange(flanges, marks);
  const ref = useRef<Group>(null);
  const m = getPlantMaterials();

  useFrame(() => {
    if (ref.current) ref.current.rotation.x = flowForFrame().shaftAngle;
  }, -80);

  // No shadow casting: the shadow map is only re-rendered when a cut moves (RevealDriver).
  return (
    <group ref={ref} name={`${part}.couplings`} position={[0, TB.shaftY, 0]}>
      <mesh name={`${part}.couplings.flanges`} geometry={flanges} material={m.steel} receiveShadow />
      <mesh name={`${part}.couplings.marks`} geometry={marks} material={m.darkMetal} receiveShadow />
    </group>
  );
}
