/**
 * Box primitives specified by world extents, which is how architectural massing is
 * naturally described ("x from 20.6 to 104, height 28").
 */
import { useLayoutEffect, useRef } from 'react';
import { BoxGeometry, InstancedMesh, Matrix4, Quaternion, Vector3, type Material } from 'three';
import type { BoxExtents, Range } from './geometry';

/** Shared unit cube for every extents-based box: one geometry upload for the whole plant. */
const UNIT_BOX = new BoxGeometry(1, 1, 1);

const mid = (r: Range) => (r[0] + r[1]) / 2;
const len = (r: Range) => Math.abs(r[1] - r[0]);

interface BoxProps extends BoxExtents {
  name?: string;
  /** One material, or six for the cube faces in the order +x, -x, +y (roof), -y, +z, -z. */
  material: Material | Material[];
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export function Box({ name, x, y, z, material, castShadow = true, receiveShadow = true }: BoxProps) {
  return (
    <mesh
      name={name}
      geometry={UNIT_BOX}
      material={material}
      position={[mid(x), mid(y), mid(z)]}
      scale={[len(x), len(y), len(z)]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  );
}

const _m = new Matrix4();
const _q = new Quaternion();
const _p = new Vector3();
const _s = new Vector3();

interface InstancedBoxesProps {
  name: string;
  boxes: readonly BoxExtents[];
  material: Material;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/** Many boxes, one draw call (facade fins, pools, rooftop units). */
export function InstancedBoxes({ name, boxes, material, castShadow = true, receiveShadow = true }: InstancedBoxesProps) {
  const ref = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    boxes.forEach((b, i) => {
      _p.set(mid(b.x), mid(b.y), mid(b.z));
      _s.set(len(b.x), len(b.y), len(b.z));
      mesh.setMatrixAt(i, _m.compose(_p, _q, _s));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [boxes]);

  return (
    <instancedMesh
      key={boxes.length}
      ref={ref}
      name={name}
      args={[UNIT_BOX, material, boxes.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  );
}
