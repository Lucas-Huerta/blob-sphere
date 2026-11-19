import type { Carousel } from '@/carousel/Carousel';

const THRESHOLD = 60; // px

/** Horizontal swipe / drag on an element changes the carousel item. */
export function bindSwipe(el: HTMLElement, carousel: Carousel): void {
  let startX = 0;
  let startY = 0;
  el.addEventListener('pointerdown', (e) => {
    startX = e.clientX;
    startY = e.clientY;
  });
  el.addEventListener('pointerup', (e) => {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) < THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0) carousel.next();
    else carousel.prev();
  });
}
