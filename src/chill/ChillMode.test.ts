import { describe, expect, it } from 'vitest';
import { ChillMode } from './ChillMode';

function run(chill: ChillMode, seconds: number, step = 0.05): void {
  for (let t = 0; t < seconds; t += step) chill.update(step);
}

describe('ChillMode', () => {
  it('stays flat while inactive', () => {
    const chill = new ChillMode();
    run(chill, 5);
    expect(chill.level).toBe(0);
    expect(chill.calm).toBe(0);
  });

  it('follows the breath once started: swollen at the end of the inhale', () => {
    const chill = new ChillMode();
    run(chill, 3); // idle time must not count towards the breath
    chill.active = true;
    run(chill, 4.2);
    expect(chill.state.phase).toBe('hold');
    expect(chill.level).toBeGreaterThan(0.95);
    expect(chill.calm).toBeGreaterThan(0.5);
  });

  it('deflates smoothly when stopped', () => {
    const chill = new ChillMode();
    chill.active = true;
    run(chill, 6);
    chill.active = false;
    chill.update(0.05);
    expect(chill.level).toBeGreaterThan(0.8);
    run(chill, 8);
    expect(chill.level).toBeLessThan(0.01);
  });

  it('notifies listeners only on a real change', () => {
    const chill = new ChillMode();
    const seen: boolean[] = [];
    chill.onChange((on) => seen.push(on));
    chill.active = true;
    chill.active = true;
    chill.toggle();
    expect(seen).toEqual([true, false]);
  });
});
