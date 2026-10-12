import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import type { Group, Material } from 'three';
import { RADIAL_SEGMENTS } from '../../config/quality';
import { useAppStore, useQualityPreset } from '../../state/store';
import { registerInterior, type InteriorLevel } from '../section/sectionLayers';
import { createRevolvedSolid, createSectionSolid, type ProfilePoint, type SectorOptions } from './geometry';
import { useDisposeOnChange } from './hooks';

/** Children are hidden while the Stage 2 section review is on (they sit in front of z = 0). */
export function FrontOfSection({ children }: { children: ReactNode }) {
  const sectionReview = useAppStore((s) => s.sectionReview);
  return <group visible={!sectionReview}>{children}</group>;
}

/**
 * Content that can only be seen once something opens the plant up: the hero reveal (by
 * level, see sectionLayers.ts) or the Stage 2 section review. Until then it stays in the
 * scene graph (addressable by ID, shaders precompiled) but is not drawn, which saves the
 * draw calls, shadow pass included, of geometry hidden inside opaque buildings or under grade.
 */
export function Interior({ level, children }: { level: InteriorLevel; children: ReactNode }) {
  const ref = useRef<Group>(null);
  useLayoutEffect(() => (ref.current ? registerInterior(ref.current, level) : undefined), [level]);
  return <group ref={ref}>{children}</group>;
}

type SectorShape = Omit<SectorOptions, 'thetaStart' | 'thetaLength' | 'segments'>;

interface SectionSectorProps extends SectorShape {
  name: string;
  /** A section material (getSectionMaterials) of the layer that cuts this structure. */
  material: Material;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/**
 * A whole cylindrical structure (wall, slab, ring, disc) that the reveal cuts with its
 * layer's section planes. Inset by a few millimetres so it never shares a face with the
 * structure it rests on (see geometry.ts).
 */
interface SectionProfileProps {
  name: string;
  /** Closed (r, y) profile, counter-clockwise; already inset where it touches neighbours. */
  profile: readonly ProfilePoint[];
  material: Material;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/** A whole solid of revolution cut by the reveal: one clean cut surface, no internal cracks. */
export function SectionProfile({ name, profile, material, castShadow = true, receiveShadow = true }: SectionProfileProps) {
  const segments = RADIAL_SEGMENTS[useQualityPreset().geometryLod];
  const geometry = useMemo(() => createRevolvedSolid(profile, segments), [profile, segments]);
  useDisposeOnChange(geometry);
  return <mesh name={name} geometry={geometry} material={material} castShadow={castShadow} receiveShadow={receiveShadow} />;
}

export function SectionSector({ name, material, castShadow = true, receiveShadow = true, ...shape }: SectionSectorProps) {
  const segments = RADIAL_SEGMENTS[useQualityPreset().geometryLod];
  const { innerRadius, outerRadius, y0, height } = shape;
  const geometry = useMemo(
    () => createSectionSolid({ innerRadius, outerRadius, y0, height, segments }),
    [innerRadius, outerRadius, y0, height, segments],
  );
  useDisposeOnChange(geometry);
  return <mesh name={name} geometry={geometry} material={material} castShadow={castShadow} receiveShadow={receiveShadow} />;
}
