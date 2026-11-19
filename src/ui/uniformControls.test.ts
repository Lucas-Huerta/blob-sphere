import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { describeUniforms, labelFor } from './uniformControls';
import { blendThreshold, isDiscarded } from '../blob/blend';

describe('describeUniforms', () => {
  it('exposes scalars and colours, skips engine uniforms', () => {
    const controls = describeUniforms({
      uTime: { value: 0 },
      uAmplitude: { value: 0.3 },
      uIor: { value: 1.45 },
      uTint: { value: new THREE.Color('#fff') },
      uEnvMap: { value: {} },
      uImpacts: { value: [] },
      uShapeBlend: { value: 0 },
      uOtherAmplitude: { value: 0 },
      uCustom: { value: 5 },
    });
    expect(controls.map((c) => c.name)).toEqual(['uAmplitude', 'uIor', 'uTint', 'uCustom']);
    expect(controls[2].kind).toBe('color');
  });

  it('keeps the default value inside the slider range', () => {
    const [c] = describeUniforms({ uGloss: { value: 90 } });
    expect(c.kind === 'number' && c.min <= 90 && 90 <= c.max).toBe(true);
  });

  it('builds readable labels', () => {
    expect(labelFor('uColorDeep')).toBe('Color deep');
    expect(labelFor('uIor')).toBe('IOR');
  });
});

describe('blend dissolve', () => {
  it('covers the whole mask range at both ends', () => {
    expect(blendThreshold(0)).toBeLessThan(0);
    expect(blendThreshold(1)).toBeGreaterThan(1);
  });

  it('partitions fragments between the two meshes', () => {
    const t = blendThreshold(0.5);
    for (const mask of [0, 0.3, 0.5, 0.8, 1]) {
      expect(isDiscarded(mask, t, true)).not.toBe(isDiscarded(mask, t, false));
    }
  });
});
