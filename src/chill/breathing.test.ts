import { describe, expect, it } from 'vitest';
import { BREATH_CYCLE, breathAt } from './breathing';

describe('breathAt (4-7-8)', () => {
  it('lasts 19 seconds per breath', () => {
    expect(BREATH_CYCLE).toBe(19);
  });

  it('walks through inhale, hold, exhale at the right times', () => {
    expect(breathAt(0).phase).toBe('inhale');
    expect(breathAt(3.99).phase).toBe('inhale');
    expect(breathAt(4).phase).toBe('hold');
    expect(breathAt(10.99).phase).toBe('hold');
    expect(breathAt(11).phase).toBe('exhale');
    expect(breathAt(18.99).phase).toBe('exhale');
  });

  it('restarts on a new cycle and counts completed breaths', () => {
    const next = breathAt(19 + 1);
    expect(next.phase).toBe('inhale');
    expect(next.cycle).toBe(1);
    expect(next.elapsed).toBeCloseTo(1);
  });

  it('reports the time left in the phase', () => {
    expect(breathAt(1).remaining).toBeCloseTo(3);
    expect(breathAt(5).remaining).toBeCloseTo(6);
    expect(breathAt(12).remaining).toBeCloseTo(7);
  });

  it('fills the lungs on the inhale, holds them full, then empties them', () => {
    expect(breathAt(0).fill).toBeCloseTo(0);
    expect(breathAt(2).fill).toBeCloseTo(0.5);
    expect(breathAt(4).fill).toBe(1);
    expect(breathAt(8).fill).toBe(1);
    expect(breathAt(11).fill).toBeCloseTo(1);
    expect(breathAt(15).fill).toBeCloseTo(0.5);
    expect(breathAt(18.999).fill).toBeCloseTo(0, 2);
  });

  it('never goes outside 0..1 and is continuous across phase borders', () => {
    let previous = breathAt(0).fill;
    for (let t = 0.01; t < BREATH_CYCLE * 2; t += 0.01) {
      const { fill } = breathAt(t);
      expect(fill).toBeGreaterThanOrEqual(0);
      expect(fill).toBeLessThanOrEqual(1);
      expect(Math.abs(fill - previous)).toBeLessThan(0.02);
      previous = fill;
    }
  });

  it('clamps negative times to the start', () => {
    expect(breathAt(-3)).toEqual(breathAt(0));
  });
});
