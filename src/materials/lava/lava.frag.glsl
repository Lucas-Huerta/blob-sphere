#include ../../shaders/chunks/noise.glsl

uniform float uTime;
uniform float uScale;
uniform float uCrackSharpness;
uniform float uGlow;
uniform float uImpactReact;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vObjPosition;
varying float vImpact;

// Ridged fbm: bright thin lines where the noise crosses zero -> cracks in the crust.
float ridgedFbm(vec3 p) {
  float sum = 0.0;
  float amp = 0.5;
  float norm = 0.0;
  for (int i = 0; i < 4; i++) {
    float r = 1.0 - abs(snoise(p));
    sum += amp * r * r;
    norm += amp;
    p *= 2.03;
    amp *= 0.5;
  }
  return sum / norm;
}

// Temperature 0..1+ -> blackbody-ish colour.
vec3 lavaRamp(float t) {
  vec3 crust = vec3(0.025, 0.012, 0.01);
  vec3 red = vec3(0.55, 0.04, 0.0);
  vec3 orange = vec3(1.0, 0.32, 0.02);
  vec3 yellow = vec3(1.0, 0.82, 0.3);
  vec3 c = mix(crust, red, smoothstep(0.15, 0.45, t));
  c = mix(c, orange, smoothstep(0.45, 0.75, t));
  c = mix(c, yellow, smoothstep(0.8, 1.05, t));
  return c;
}

void main() {
  vec3 n = normalize(vWorldNormal);
  vec3 v = normalize(cameraPosition - vWorldPosition);
  float fresnel = pow(1.0 - max(dot(n, v), 0.0), 2.5);

  // Slow upward flow, domain-warped so the cracks drift and breathe.
  vec3 q = vObjPosition * uScale + vec3(0.0, -uTime * 0.07, uTime * 0.03);
  vec3 warp = vec3(snoise(q * 0.6 + 1.7), snoise(q * 0.6 + 5.3), snoise(q * 0.6 + 9.1));
  float ridge = ridgedFbm(q + warp * 0.8);

  // Large slow pulses of heat across the body.
  float pulse = 0.5 + 0.5 * snoise(vObjPosition * 1.2 + vec3(0.0, 0.0, uTime * 0.25));
  float heat = pow(ridge, uCrackSharpness) * (0.75 + 0.45 * pulse);

  // Clicking heats the surface under the finger.
  heat += abs(vImpact) * uImpactReact;

  // The rim cools into crust seen at a grazing angle.
  heat *= 1.0 - 0.45 * fresnel;

  vec3 col = lavaRamp(heat) * uGlow;

  // Faint diffuse light on the cold crust so its shape still reads.
  float diffuse = max(dot(n, normalize(vec3(0.4, 0.8, 0.5))), 0.0);
  col += vec3(0.06, 0.035, 0.03) * diffuse * (1.0 - smoothstep(0.2, 0.5, heat));

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
