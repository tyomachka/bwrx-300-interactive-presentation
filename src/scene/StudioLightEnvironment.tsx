/**
 * Procedural studio image-based lighting.
 *
 * A handful of emissive "softbox" panels are rendered once into a prefiltered (PMREM)
 * environment map and assigned to `scene.environment`. There is no HDR file and no
 * loader code in the bundle, so no CDN or network path exists (PROJECT.md §7, §20).
 * After that single render the per-frame cost is zero.
 */
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { Color, DoubleSide, Mesh, MeshBasicMaterial, PlaneGeometry, PMREMGenerator, Scene, type Vector3Tuple } from 'three';

interface Softbox {
  /** Radiance multiplier (> 1 is fine: PMREM renders to a half-float target). */
  intensity: number;
  color: string;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: [number, number];
}

const SOFTBOXES: Softbox[] = [
  // Large soft overhead box: broad, even top light on vertical steel.
  { intensity: 2.2, color: '#ffffff', position: [0, 12, 0], rotation: [Math.PI / 2, 0, 0], scale: [14, 14] },
  // Two tall strip boxes: the long vertical highlights that read as brushed metal.
  { intensity: 3.0, color: '#f4f1ec', position: [-9, 3, 4], rotation: [0, Math.PI / 2, 0], scale: [2, 10] },
  { intensity: 1.6, color: '#e4ebf3', position: [9, 3, -3], rotation: [0, -Math.PI / 2, 0], scale: [2, 10] },
  // Faint back panel so the shadow side never goes fully black on a weak projector.
  { intensity: 0.5, color: '#cfd6de', position: [0, 2, -10], rotation: [0, 0, 0], scale: [16, 4] },
];

const AMBIENT = '#08090a';
/** Slight blur keeps highlights soft (product look) and hides the panel edges. */
const BLUR_SIGMA = 0.04;

export function StudioLightEnvironment({ resolution, intensity }: { resolution: number; intensity: number }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    const studio = new Scene();
    studio.background = new Color(AMBIENT);
    const geometry = new PlaneGeometry(1, 1);
    const materials: MeshBasicMaterial[] = [];
    for (const box of SOFTBOXES) {
      const material = new MeshBasicMaterial({ color: new Color(box.color).multiplyScalar(box.intensity), side: DoubleSide });
      materials.push(material);
      const panel = new Mesh(geometry, material);
      panel.position.set(...box.position);
      panel.rotation.set(...box.rotation);
      panel.scale.set(box.scale[0], box.scale[1], 1);
      studio.add(panel);
    }

    const pmrem = new PMREMGenerator(gl);
    const target = pmrem.fromScene(studio, BLUR_SIGMA, 0.1, 100, { size: resolution });
    pmrem.dispose();
    geometry.dispose();
    materials.forEach((m) => m.dispose());

    const previous = scene.environment;
    scene.environment = target.texture;
    scene.environmentIntensity = intensity;

    return () => {
      if (scene.environment === target.texture) scene.environment = previous;
      target.dispose();
    };
  }, [gl, scene, resolution, intensity]);

  return null;
}
