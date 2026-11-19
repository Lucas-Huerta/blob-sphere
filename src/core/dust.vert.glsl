uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uAmount;
uniform vec3 uBox;
uniform vec3 uCenter;

attribute vec4 aSeed; // x, y, z: per-particle drift; w: twinkle phase and density rank

varying float vAlpha;

void main() {
  // Slow, individual drift, wrapped inside the box so the cloud never runs out.
  vec3 drift = (aSeed.xyz - 0.5) * vec3(0.5, 0.35, 0.3) + vec3(0.0, 0.05, 0.0);
  vec3 p = position + drift * uTime;
  p += 0.12 * vec3(sin(uTime * 0.31 + aSeed.w * 40.0), cos(uTime * 0.27 + aSeed.x * 31.0), sin(uTime * 0.23 + aSeed.y * 27.0));
  p = mod(p + 0.5 * uBox, uBox) - 0.5 * uBox + uCenter;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float depth = max(-mv.z, 0.1);

  // Near specks blur into big faint bokeh, far ones stay tiny and crisp: this is the depth cue.
  float near = smoothstep(7.0, 1.5, depth);
  gl_PointSize = clamp(uSize * uPixelRatio * (0.5 + aSeed.y) * 7.0 / depth * (1.0 + 2.5 * near), 1.0, 90.0 * uPixelRatio);

  vec3 q = abs((p - uCenter) / (0.5 * uBox));
  float edge = (1.0 - smoothstep(0.75, 1.0, q.x)) * (1.0 - smoothstep(0.75, 1.0, q.y)) * (1.0 - smoothstep(0.75, 1.0, q.z));
  float twinkle = 0.65 + 0.35 * sin(uTime * (0.5 + aSeed.z) + aSeed.w * 60.0);
  float shown = 1.0 - step(uAmount, aSeed.w); // density: only the first `uAmount` fraction exists
  vAlpha = edge * twinkle * shown * mix(1.0, 0.35, near) * smoothstep(0.4, 2.0, depth);
}
