import * as THREE from 'three';

/** Min pointer travel (px) and delay (ms) between two ripples while dragging. */
const DRAG_DISTANCE = 16;
const DRAG_INTERVAL = 50;
const DRAG_RIPPLE_STRENGTH = 0.3;

export interface PokeHandlers {
  /** Press / ripple at a point; returns whether the blob was hit. */
  poke(ndc: THREE.Vector2, strength: number): boolean;
  /** Pointer position while a press that started on the blob is held. */
  grab(ndc: THREE.Vector2): void;
  release(): void;
}

export interface PokeBinding {
  /** True when the current press started on the blob (so it must not swipe the carousel). */
  readonly grabbed: boolean;
}

/** Press on an element pokes it; dragging while pressed holds the surface and drags it along. */
export function bindPoke(el: HTMLElement, handlers: PokeHandlers): PokeBinding {
  const state = { grabbed: false };
  let lastX = 0;
  let lastY = 0;
  let lastTime = 0;

  const toNdc = (e: PointerEvent): THREE.Vector2 => {
    const r = el.getBoundingClientRect();
    return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  };
  const end = (): void => handlers.release();

  el.style.touchAction = 'none';

  el.addEventListener('pointerdown', (e) => {
    const ndc = toNdc(e);
    state.grabbed = handlers.poke(ndc, 1);
    if (state.grabbed) handlers.grab(ndc);
    lastX = e.clientX;
    lastY = e.clientY;
    lastTime = e.timeStamp;
  });

  el.addEventListener('pointermove', (e) => {
    if (e.buttons === 0 || !state.grabbed) return;
    const ndc = toNdc(e);
    handlers.grab(ndc);
    if (Math.hypot(e.clientX - lastX, e.clientY - lastY) < DRAG_DISTANCE) return;
    if (e.timeStamp - lastTime < DRAG_INTERVAL) return;
    lastX = e.clientX;
    lastY = e.clientY;
    lastTime = e.timeStamp;
    handlers.poke(ndc, DRAG_RIPPLE_STRENGTH);
  });

  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('pointerleave', (e) => {
    if (e.buttons === 0) end();
  });

  return {
    get grabbed() {
      return state.grabbed;
    },
  };
}
