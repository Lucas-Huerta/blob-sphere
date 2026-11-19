import { describe, expect, it, vi } from 'vitest';
import { Carousel } from './Carousel';

describe('Carousel', () => {
  it('wraps around in both directions', () => {
    const c = new Carousel(3);
    c.prev();
    expect(c.index).toBe(2);
    c.next();
    expect(c.index).toBe(0);
  });

  it('emits change only when the index changes', () => {
    const c = new Carousel(3);
    const fn = vi.fn();
    c.onChange(fn);
    c.goTo(0);
    c.goTo(4);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1);
  });

  it('stops notifying after unsubscribe', () => {
    const c = new Carousel(2);
    const fn = vi.fn();
    c.onChange(fn)();
    c.next();
    expect(fn).not.toHaveBeenCalled();
  });
});
