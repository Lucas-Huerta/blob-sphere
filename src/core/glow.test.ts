import { describe, expect, it } from 'vitest';
import { glowColor } from './glow';

describe('glowColor', () => {
  it('lifts a near-black background into a light tone of the same hue', () => {
    const hex = glowColor('#110605'); // dark red
    const r = parseInt(hex.slice(1, 3), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    expect(r).toBeGreaterThan(150);
    expect(r).toBeGreaterThan(b);
  });

  it('prefers an explicit accent', () => {
    expect(glowColor('#110605', '#00ff00')).toBe('#00ff00');
  });
});
