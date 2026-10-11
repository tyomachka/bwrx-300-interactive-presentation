import { useMemo, type ReactNode } from 'react';
import type { BufferGeometry, Material } from 'three';
import { useAppStore } from '../../state/store';
import { createHalfSector, HALVES, type Half, type SectorOptions } from './geometry';
import { useDisposeOnChange, useHalfSegments } from './hooks';

/** Children are hidden while the section review is on (they sit in front of z = 0). */
export function FrontOfSection({ children }: { children: ReactNode }) {
  const sectionReview = useAppStore((s) => s.sectionReview);
  return <group visible={!sectionReview}>{children}</group>;
}

/**
 * Content that can only be seen when something reveals the interior: today the section
 * review, later X-ray and cutaway. In exterior views it stays in the scene graph (still
 * addressable by ID) but is not drawn, which saves about a third of the draw calls,
 * shadow pass included, for geometry hidden inside opaque buildings or under grade.
 */
export function Interior({ children }: { children: ReactNode }) {
  const revealed = useAppStore((s) => s.sectionReview);
  return <group visible={revealed}>{children}</group>;
}

type SectorShape = Omit<SectorOptions, 'thetaStart' | 'thetaLength' | 'segments'>;

interface SplitSectorProps extends SectorShape {
  name: string;
  material: Material | Material[];
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/**
 * A cylindrical sector structure (wall, slab, ring) built as back + front halves. The front
 * half hides during section review, so the cut faces of the back half become the section.
 */
export function SplitSector({ name, material, castShadow = true, receiveShadow = true, ...shape }: SplitSectorProps) {
  const segments = useHalfSegments();
  const { innerRadius, outerRadius, y0, height } = shape;
  const halves = useMemo(
    () =>
      Object.fromEntries(
        HALVES.map((half) => [half, createHalfSector(half, { innerRadius, outerRadius, y0, height, segments })]),
      ) as Record<Half, BufferGeometry>,
    [innerRadius, outerRadius, y0, height, segments],
  );
  useDisposeOnChange(halves.back, halves.front);

  return (
    <>
      <mesh name={`${name}.back`} geometry={halves.back} material={material} castShadow={castShadow} receiveShadow={receiveShadow} />
      <FrontOfSection>
        <mesh name={`${name}.front`} geometry={halves.front} material={material} castShadow={castShadow} receiveShadow={receiveShadow} />
      </FrontOfSection>
    </>
  );
}
