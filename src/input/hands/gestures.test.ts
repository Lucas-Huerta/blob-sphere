import { describe, expect, it } from 'vitest';
import { interpret, nextPinching, readPose, zoomFactor, type Hand, type Landmark } from './gestures';

/** Builds a synthetic hand: wrist at (0.5, 0.8), middle knuckle 0.2 above. */
function makeHand({ open = true, pinch = false, at = { x: 0.5, y: 0.8 } } = {}): Hand {
  const lm: Landmark[] = Array.from({ length: 21 }, () => ({ x: at.x, y: at.y }));
  lm[0] = { x: at.x, y: at.y };
  lm[9] = { x: at.x, y: at.y - 0.2 };
  // [tip, pip] pairs: extended tips are far from the wrist, curled ones close.
  for (const [tip, pip] of [[8, 6], [12, 10], [16, 14], [20, 18]]) {
    lm[pip] = { x: at.x, y: at.y - 0.15 };
    lm[tip] = { x: at.x, y: at.y - (open ? 0.35 : 0.05) };
  }
  lm[4] = { x: at.x - 0.1, y: at.y - 0.2 };
  if (pinch) lm[8] = { x: at.x - 0.1 + 0.01, y: at.y - 0.2 };
  else lm[8] = { x: at.x + 0.1, y: at.y - 0.35 };
  return lm;
}

describe('readPose', () => {
  it('detects an open hand and mirrors x', () => {
    const pose = readPose(makeHand({ at: { x: 0.2, y: 0.8 } }));
    expect(pose.open).toBe(true);
    expect(pose.palm.x).toBeCloseTo(0.8);
  });

  it('detects a closed hand', () => {
    expect(readPose(makeHand({ open: false })).open).toBe(false);
  });

  it('measures pinch relative to hand size', () => {
    expect(readPose(makeHand({ pinch: true })).pinchRatio).toBeLessThan(0.1);
    expect(readPose(makeHand()).pinchRatio).toBeGreaterThan(0.8);
  });
});

describe('nextPinching', () => {
  it('uses hysteresis', () => {
    expect(nextPinching(false, 0.55)).toBe(false);
    expect(nextPinching(true, 0.55)).toBe(true);
    expect(nextPinching(false, 0.3)).toBe(true);
    expect(nextPinching(true, 0.8)).toBe(false);
  });
});

describe('interpret', () => {
  const state = (pinch: boolean, x = 0.5) => ({ pose: readPose(makeHand({ pinch, at: { x, y: 0.8 } })), pinching: pinch });

  it('is idle without hands', () => {
    expect(interpret([], 1.6).kind).toBe('idle');
  });

  it('reports an open hand', () => {
    expect(interpret([state(false)], 1.6).kind).toBe('open');
  });

  it('reports a single pinch', () => {
    const frame = interpret([state(true)], 1.6);
    expect(frame.kind).toBe('pinch');
    expect(frame.pinchPoint).toBeDefined();
  });

  it('reports zoom with two pinching hands', () => {
    const frame = interpret([state(true, 0.2), state(true, 0.8)], 1);
    expect(frame.kind).toBe('zoom');
    expect(frame.zoomDistance).toBeGreaterThan(0.5);
  });
});

describe('zoomFactor', () => {
  it('shrinks the camera distance when hands move apart', () => {
    expect(zoomFactor(0.3, 0.6)).toBeCloseTo(0.55);
    expect(zoomFactor(0.3, 0.45)).toBeLessThan(1);
  });

  it('grows it when hands come together and clamps', () => {
    expect(zoomFactor(0.3, 0.2)).toBeGreaterThan(1);
    expect(zoomFactor(0.3, 0.01)).toBe(1.8);
  });

  it('is neutral with a degenerate start', () => {
    expect(zoomFactor(0, 0.5)).toBe(1);
  });
});
