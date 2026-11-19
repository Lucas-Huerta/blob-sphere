type Listener = (index: number) => void;

/** Pure carousel state (wrapping index + change events). No DOM, easy to test. */
export class Carousel {
  private _index = 0;
  private _direction: 1 | -1 = 1;
  private listeners = new Set<Listener>();

  constructor(readonly count: number) {
    if (count < 1) throw new Error('Carousel needs at least one item');
  }

  get index(): number {
    return this._index;
  }

  /** Direction of the last change along the shortest path (+1 = forward). */
  get direction(): 1 | -1 {
    return this._direction;
  }

  next(): void {
    this.goTo(this._index + 1);
  }

  prev(): void {
    this.goTo(this._index - 1);
  }

  goTo(index: number): void {
    const wrapped = ((index % this.count) + this.count) % this.count;
    if (wrapped === this._index) return;
    let delta = wrapped - this._index;
    if (delta > this.count / 2) delta -= this.count;
    else if (delta < -this.count / 2) delta += this.count;
    this._direction = delta >= 0 ? 1 : -1;
    this._index = wrapped;
    this.listeners.forEach((fn) => fn(wrapped));
  }

  onChange(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}
