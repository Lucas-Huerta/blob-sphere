#include ../../shaders/chunks/noise.glsl

uniform float uTime;
uniform float uSpeed;
uniform float uScale;        // width of the curtains (higher = thinner, more of them)
uniform float uStretch;      // vertical stretch of the streaks (lower = longer curtains)
uniform float uIntensity;
uniform float uRim;          // strength of the glowing edge
uniform float uImpactReact;
uniform vec3 uColorBase;     // dark night sky body
uniform vec3 uColorA;        // lower curtains
uniform vec3 uColorB;        // middle curtains
uniform vec3 uColorC;        // upper fringes and rim

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vObjPosition;
varying float vImpact;

// One curtain layer: noise stretched along Y gives vertical streaks, domain-warped so the
// ribbons fold and drift like a real aurora. Returns brightness in 0..1.
float curtain(vec3 p, float scale, float speed, float seed, float t) {
  vec3 q = vec3(p.x * scale, p.y * uStretch * scale, p.z * scale);
  vec3 warp = vec3(snoise(q * 0.6 + seed), snoise(q * 0.6 + seed + 7.3), 0.0);
  float n = snoise(q + warp * 1.4 + vec3(0.0, -t * speed, seed + t * 0.08 * speed));
  float ribbon = smoothstep(0.05, 0.85, 0.5 + 0.5 * n);
  return ribbon * ribbon;
}

void main() {
  vec3 n = normalize(vWorldNormal);
  vec3 v = normalize(cameraPosition - vWorldPosition);
  float facing = max(dot(n, v), 0.0);
  float fresnel = pow(1.0 - facing, 2.2);

  float t = uTime * uSpeed;
  vec3 p = vObjPosition;
  float height = p.y;

  // Night-sky body: darker at the bottom, a deep blue towards the top.
  vec3 col = mix(uColorBase * 0.5, uColorBase * 1.8, smoothstep(-1.0, 1.0, height));

  // Three curtain layers at different scales and speeds, drawn additively. They fade out
  // towards the bottom (aurora hangs from above) and glow brightest in the middle band.
  float vert = smoothstep(-0.8, 0.5, height) * (1.0 - 0.35 * smoothstep(0.6, 1.0, height));
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float b = curtain(p, uScale * (1.0 + 0.7 * fi), 1.0 + 0.4 * fi, 3.0 * fi, t);
    // Colour by height with a little noise: green at the bottom edge, cyan, then violet on top.
    float k = height + 0.35 * snoise(p * 1.3 + fi * 5.0 + t * 0.05);
    vec3 c = mix(uColorA, uColorB, smoothstep(-0.2, 0.45, k));
    c = mix(c, uColorC, smoothstep(0.35, 0.95, k));
    col += c * b * vert * (0.75 - 0.18 * fi) * uIntensity;
  }

  // Glowing edge: the corona slowly cycles between the three colours around the blob.
  float cyc = 0.5 + 0.5 * sin(t * 0.4 + p.y * 2.0 + p.x);
  vec3 rimCol = mix(mix(uColorA, uColorB, cyc), uColorC, 0.5 + 0.5 * sin(t * 0.25 + p.z * 2.0));
  col += rimCol * fresnel * uRim;

  // Clicks make a pulse of light under the finger.
  col += uColorB * abs(vImpact) * uImpactReact;

  // Soft tonemap so overlapping layers saturate towards white instead of clipping.
  col = 1.0 - exp(-col);

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
