const KEY = 'blob-glow';

/** Soft UI glow is opt-in on weak or touch devices, on by default elsewhere; the user's choice always wins. */
function defaultEnabled(): boolean {
  const weak = (navigator.hardwareConcurrency ?? 8) <= 4;
  const touch = window.matchMedia('(pointer: coarse)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return !(weak || touch || reduced);
}

function read(): boolean {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'on' || v === 'off') return v === 'on';
  } catch {
    /* storage unavailable: fall through to the default */
  }
  return defaultEnabled();
}

export function isGlowEnabled(): boolean {
  return document.documentElement.dataset.glow === 'on';
}

export function setGlowEnabled(on: boolean): void {
  document.documentElement.dataset.glow = on ? 'on' : 'off';
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* ignore */
  }
}

/** Apply the saved (or default) preference once at startup. */
export function initGlow(): void {
  document.documentElement.dataset.glow = read() ? 'on' : 'off';
}
