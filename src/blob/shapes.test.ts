import { describe, expect, it } from 'vitest';
import { SHAPES, getShape, resolveShape, shapeModeValue } from './shapes';

describe('shapes', () => {
  it('has unique ids and builds a geometry with positions and normals', () => {
    expect(new Set(SHAPES.map((s) => s.id)).size).toBe(SHAPES.length);
    for (const shape of SHAPES) {
      const geometry = shape.createGeometry();
      expect(geometry.getAttribute('position').count).toBeGreaterThan(100);
      expect(geometry.getAttribute('normal')).toBeDefined();
      geometry.dispose();
    }
  });

  it('keeps every shape inside the framing of the unit sphere', () => {
    for (const shape of SHAPES) {
      const geometry = shape.createGeometry();
      geometry.computeBoundingSphere();
      expect(geometry.boundingSphere!.radius).toBeLessThanOrEqual(1.2);
      geometry.dispose();
    }
  });

  it('maps modes to distinct shader values', () => {
    const values = SHAPES.map(shapeModeValue);
    expect(new Set(values).size).toBe(3);
    expect(shapeModeValue(getShape('torus'))).toBe(shapeModeValue(getShape('knot')));
  });

  it('resolves "auto" to the material preference, falling back to the sphere', () => {
    expect(resolveShape('auto', 'lowpoly')).toBe('lowpoly');
    expect(resolveShape('auto', undefined)).toBe('sphere');
    expect(resolveShape('knot', 'lowpoly')).toBe('knot');
  });

  it('throws on an unknown id', () => {
    expect(() => getShape('cube' as never)).toThrow();
  });
});
