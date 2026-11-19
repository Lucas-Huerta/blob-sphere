import * as THREE from 'three';

/**
 * UI glow colour for a material: the hue of its page background, lifted into a light, saturated tone so it reads
 * on a near-black stage. A material may pass its own `accent` instead of relying on the derived tint.
 */
export function glowColor(background: string, accent?: string): string {
  if (accent) return `#${new THREE.Color(accent).getHexString()}`;
  const hsl = { h: 0, s: 0, l: 0 };
  new THREE.Color(background).getHSL(hsl);
  const out = new THREE.Color().setHSL(hsl.h, Math.min(0.85, Math.max(0.45, hsl.s + 0.3)), 0.62);
  return `#${out.getHexString()}`;
}
