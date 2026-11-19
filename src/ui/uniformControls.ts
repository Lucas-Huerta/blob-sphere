import * as THREE from 'three';

export type UniformControl =
  | { kind: 'number'; name: string; label: string; min: number; max: number; step: number }
  | { kind: 'color'; name: string; label: string };

/** Uniforms driven by the engine (time, impacts, blend plumbing), never exposed as sliders. */
const INTERNAL = /^u(Time|EnvMap|Impacts|ImpactStrength|Grab|GrabDrag|Blend|BlendSide|ShapeBlend|Other.*)$/;

/** Sensible slider ranges for well-known uniforms; anything else gets a range derived from its default. */
const RANGES: Record<string, [min: number, max: number, step: number]> = {
  uAmplitude: [0, 0.8, 0.005],
  uFrequency: [0.2, 4, 0.01],
  uIor: [1, 2.6, 0.01],
  uFilmIor: [1, 2.6, 0.01],
  uDispersion: [0, 0.2, 0.001],
  uImpactReact: [0, 80, 0.5],
};

/** `uColorDeep` → `Color deep` */
export function labelFor(name: string): string {
  const words = name
    .replace(/^u/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/\bior\b/, 'IOR');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function rangeFor(name: string, value: number): [number, number, number] {
  const known = RANGES[name];
  if (known) return [Math.min(known[0], value), Math.max(known[1], value), known[2]];
  const max = value === 0 ? 1 : Math.abs(value) * 3;
  return [value < 0 ? -max : 0, max, max / 200];
}

/** Lists the user-tweakable uniforms of a material: every scalar and every colour. */
export function describeUniforms(uniforms: Record<string, { value: unknown }>): UniformControl[] {
  const controls: UniformControl[] = [];
  for (const [name, { value }] of Object.entries(uniforms)) {
    if (INTERNAL.test(name)) continue;
    if (typeof value === 'number') {
      const [min, max, step] = rangeFor(name, value);
      controls.push({ kind: 'number', name, label: labelFor(name), min, max, step });
    } else if (value instanceof THREE.Color) {
      controls.push({ kind: 'color', name, label: labelFor(name) });
    }
  }
  return controls;
}
