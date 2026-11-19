import type * as THREE from 'three';

/**
 * Dissolve threshold for a blend amount in 0..1. Slightly overshoots [0, 1] so the
 * per-vertex mask (0..1) is fully on one side at both ends of the slider.
 */
export function blendThreshold(amount: number): number {
  const a = Math.min(1, Math.max(0, amount));
  return -0.01 + a * 1.02;
}

/** Whether a fragment with the given dissolve mask is discarded by the primary / partner mesh. */
export function isDiscarded(mask: number, threshold: number, primary: boolean): boolean {
  return primary ? mask < threshold : mask >= threshold;
}

const MAIN = 'void main() {';

/**
 * Patches a material so it takes part in a dissolve blend: the vertex stage computes a stable
 * noise mask on the unit sphere, the fragment stage discards the half assigned to the other
 * material. Both meshes are otherwise drawn exactly like normal, whatever their blending mode.
 * Requires the vertex shader to include `noise.glsl` (every blob material does).
 */
export function patchForBlend(shader: Pick<THREE.WebGLProgramParametersWithUniforms, 'vertexShader' | 'fragmentShader'>): void {
  shader.vertexShader = shader.vertexShader.replace(
    MAIN,
    `varying float vBlendMask;
float blendMaskAt(vec3 p) { return clamp(0.5 + 0.7 * snoise(p * 1.6 + 11.0), 0.0, 1.0); }
${MAIN}
  vBlendMask = blendMaskAt(position);`,
  );
  shader.fragmentShader = shader.fragmentShader.replace(
    MAIN,
    `uniform float uBlend;
uniform float uBlendSide;
varying float vBlendMask;
${MAIN}
  if (uBlendSide > 0.0 ? vBlendMask < uBlend : vBlendMask >= uBlend) discard;`,
  );
}
