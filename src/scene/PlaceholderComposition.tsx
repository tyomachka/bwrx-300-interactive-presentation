/**
 * STAGE 1 PLACEHOLDER: deliberately simple primitives for checking lighting, materials
 * and scale. It is NOT reactor geometry and is replaced from Stage 2 onward.
 *
 * Scale anchors (1 unit = 1 m):
 *  - steel column: 4 m diameter x 27 m, the official BWRX-300 RPV inside dimensions
 *    (General Description 005N9751 Rev J, Table 2-1), used here only as a size reference;
 *  - human figure: 1.8 m;
 *  - everything else: educational approximation, chosen for composition only.
 */
import { useMemo } from 'react';
import { CubicBezierCurve3, Vector3 } from 'three';
import { RADIAL_SEGMENTS } from '../config/quality';
import { PALETTE } from '../config/render';
import { useQualityPreset } from '../state/store';
import { PLINTH } from './layout';

const PEDESTAL = { radius: 3.2, height: 2 } as const;
const COLUMN = { radius: 2, height: 27 } as const; // RPV-scale reference
const BLOCK = { size: [14, 7, 9] as const, position: [-21, 0, -7] as const };

// Brushed/matte industrial steel, explicitly not mirror chrome (PROJECT.md §17).
const steel = { color: PALETTE.steel, metalness: 0.6, roughness: 0.48 } as const;
const concrete = { color: PALETTE.concrete, metalness: 0, roughness: 0.9 } as const;
const painted = { color: PALETTE.paintedEquipment, metalness: 0.1, roughness: 0.72 } as const;

const meta = { placeholder: true, approximation: 'educational' } as const;

export function PlaceholderComposition() {
  const { geometryLod } = useQualityPreset();
  const segments = RADIAL_SEGMENTS[geometryLod];

  const base = PLINTH.height + PEDESTAL.height;
  const columnShaft = COLUMN.height - COLUMN.radius; // shaft + hemispherical cap = 27 m

  const pipeCurve = useMemo(() => {
    const blockTop = PLINTH.height + BLOCK.size[1];
    return new CubicBezierCurve3(
      new Vector3(-COLUMN.radius + 0.2, base + 17, 0),
      new Vector3(-12, base + 17, 0),
      new Vector3(-17, base + 17, -7),
      new Vector3(-17, blockTop - 0.2, -7),
    );
  }, [base]);

  return (
    <group name="placeholder" userData={meta}>
      <mesh name="placeholder.plinth" position-y={PLINTH.height / 2} receiveShadow castShadow>
        <boxGeometry args={[PLINTH.width, PLINTH.height, PLINTH.depth]} />
        <meshStandardMaterial {...concrete} color={PALETTE.plinth} roughness={0.95} />
      </mesh>

      <mesh name="placeholder.pedestal" position-y={PLINTH.height + PEDESTAL.height / 2} castShadow receiveShadow>
        <cylinderGeometry args={[PEDESTAL.radius, PEDESTAL.radius, PEDESTAL.height, segments]} />
        <meshStandardMaterial {...concrete} />
      </mesh>

      {/* Single accent swatch: checks the project highlight colour under tone mapping. */}
      <mesh name="placeholder.accentSwatch" position-y={base + 0.02} rotation-x={Math.PI / 2}>
        <torusGeometry args={[PEDESTAL.radius - 0.05, 0.06, 8, segments]} />
        <meshStandardMaterial color={PALETTE.accent} emissive={PALETTE.accent} emissiveIntensity={0.6} roughness={0.4} />
      </mesh>

      <group name="placeholder.column" position-y={base}>
        <mesh position-y={columnShaft / 2} castShadow receiveShadow>
          <cylinderGeometry args={[COLUMN.radius, COLUMN.radius, columnShaft, segments, 1]} />
          <meshStandardMaterial {...steel} />
        </mesh>
        <mesh position-y={columnShaft} castShadow>
          <sphereGeometry args={[COLUMN.radius, segments, segments / 2, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial {...steel} />
        </mesh>
      </group>

      <mesh
        name="placeholder.equipmentBlock"
        position={[BLOCK.position[0], PLINTH.height + BLOCK.size[1] / 2, BLOCK.position[2]]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={BLOCK.size} />
        <meshStandardMaterial {...painted} />
      </mesh>

      <mesh name="placeholder.pipe" castShadow>
        <tubeGeometry args={[pipeCurve, segments, 0.45, Math.max(8, segments / 4), false]} />
        <meshStandardMaterial {...steel} roughness={0.52} />
      </mesh>

      {/* 1.8 m human figure for scale. */}
      <mesh name="placeholder.humanScale" position={[6, PLINTH.height + 0.9, 7]} castShadow>
        <capsuleGeometry args={[0.25, 1.3, 4, 12]} />
        <meshStandardMaterial color="#c9ccd0" roughness={0.7} />
      </mesh>
    </group>
  );
}
