import * as THREE from 'three';

export type ShapeId = 'sphere' | 'lowpoly' | 'torus' | 'knot';

/**
 * How the vertex shader displaces a shape (`uShapeMode`, see blobDisplace.glsl):
 * - `radial`: every vertex sits on the unit sphere and moves along its own direction;
 * - `polyhedron`: radial too, but the base radius follows an icosahedron that melts into a blob;
 * - `surface`: vertices move along the geometry normal (shapes that are not star-shaped).
 */
export type ShapeMode = 'radial' | 'polyhedron' | 'surface';

export interface ShapeDef {
  id: ShapeId;
  name: string;
  mode: ShapeMode;
  /**
   * Relief scale for `surface` shapes: the noise amplitude of a material is defined for a unit
   * sphere, so it is scaled down to the thickness of the tube.
   */
  reliefScale: number;
  createGeometry(): THREE.BufferGeometry;
}

export const SHAPES: readonly ShapeDef[] = [
  {
    id: 'sphere',
    name: 'Sphere',
    mode: 'radial',
    reliefScale: 1,
    createGeometry: () => new THREE.IcosahedronGeometry(1, 64),
  },
  {
    id: 'lowpoly',
    name: 'Low-poly',
    mode: 'polyhedron',
    reliefScale: 1,
    createGeometry: () => new THREE.IcosahedronGeometry(1, 64),
  },
  {
    id: 'torus',
    name: 'Torus',
    mode: 'surface',
    reliefScale: 0.28,
    createGeometry: () => {
      const geometry = new THREE.TorusGeometry(0.68, 0.3, 72, 160);
      // Tilted so the ring is seen from an angle, not face-on, as it turns.
      geometry.rotateX(Math.PI * 0.3);
      return geometry;
    },
  },
  {
    id: 'knot',
    name: 'Knot',
    mode: 'surface',
    reliefScale: 0.2,
    createGeometry: () => new THREE.TorusKnotGeometry(0.62, 0.2, 320, 48, 2, 3),
  },
];

export const DEFAULT_SHAPE: ShapeId = 'sphere';

const MODE_VALUE: Record<ShapeMode, number> = { radial: 0, polyhedron: 1, surface: 2 };

/** Numeric value of `uShapeMode` for a shape. */
export function shapeModeValue(shape: ShapeDef): number {
  return MODE_VALUE[shape.mode];
}

export function getShape(id: ShapeId): ShapeDef {
  const shape = SHAPES.find((s) => s.id === id);
  if (!shape) throw new Error(`Unknown shape: "${id}"`);
  return shape;
}

/** What the user picked in the settings: a fixed shape, or whatever the current material prefers. */
export type ShapeChoice = ShapeId | 'auto';

export function resolveShape(choice: ShapeChoice, materialShape: ShapeId | undefined): ShapeId {
  return choice === 'auto' ? (materialShape ?? DEFAULT_SHAPE) : choice;
}
