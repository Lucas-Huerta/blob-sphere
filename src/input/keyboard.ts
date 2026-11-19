import type { Carousel } from '@/carousel/Carousel';

export function bindKeyboard(carousel: Carousel): void {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') carousel.next();
    else if (e.key === 'ArrowLeft') carousel.prev();
  });
}
