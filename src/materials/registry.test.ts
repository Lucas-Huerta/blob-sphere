import { describe, expect, it } from 'vitest';
import { collectMaterials } from './registry';
import type { MaterialDef } from './types';

const def = (id: string, order?: number): MaterialDef => ({
  id,
  name: id,
  description: '',
  background: '#000',
  order,
  create: () => {
    throw new Error('not used');
  },
});

describe('collectMaterials', () => {
  it('sorts by order, then id, with unordered materials last', () => {
    const result = collectMaterials([
      { zed: def('zed') },
      { b: def('b', 20), a: def('a', 20), first: def('first', 5) },
    ]);
    expect(result.map((m) => m.id)).toEqual(['first', 'a', 'b', 'zed']);
  });

  it('flattens arrays of defs and ignores unrelated exports', () => {
    const result = collectMaterials([{ list: [def('x', 1), def('y', 2)], other: 42, nope: null }]);
    expect(result.map((m) => m.id)).toEqual(['x', 'y']);
  });

  it('throws on duplicate ids', () => {
    expect(() => collectMaterials([{ a: def('dup') }, { b: def('dup') }])).toThrow(/dup/);
  });
});
