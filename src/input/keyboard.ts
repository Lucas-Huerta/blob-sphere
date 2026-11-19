import type { Carousel } from '@/carousel/Carousel';

/** Arrow keys inside a form control belong to that control (sliders, text fields). */
function isEditing(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest('input, select, textarea') !== null;
}

export function bindKeyboard(carousel: Carousel): void {
  window.addEventListener('keydown', (e) => {
    if (isEditing(e.target)) return;
    if (e.key === 'ArrowRight') carousel.next();
    else if (e.key === 'ArrowLeft') carousel.prev();
  });
}
