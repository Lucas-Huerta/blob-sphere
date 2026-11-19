#include ../../shaders/chunks/noise.glsl

uniform float uTime;
uniform float uSpeed;
uniform float uScale;
uniform float uArcWidth;
uniform float uGlow;
uniform float uImpactReact;
uniform vec3 uColorA;     // deep body of the plasma
uniform vec3 uColorB;     // bright glow
uniform vec3 uColorCore;  // white-hot centre of the arcs

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vObjPosition;
varying float vImpact;

// Four-octave fbm in 0..1.
float fbm(vec3 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    sum += amp * snoise(p);
    p = p * 2.02 + 3.7;
    amp *= 0.5;
  }
  return 0.5 + 0.5 * sum / 0.9375;
}

// Thin bright filament where a noise field crosses zero: a lightning arc.
float arc(float field, float width) {
  float d = abs(field) / width;
  return 1.0 / (1.0 + d * d * 40.0);
}

void main() {
  vec3 n = normalize(vWorldNormal);
  vec3 v = normalize(cameraPosition - vWorldPosition);
  float facing = max(dot(n, v), 0.0);
  float fresnel = pow(1.0 - facing, 2.0);

  float t = uTime * uSpeed;
  vec3 q = vObjPosition * uScale;

  // Swirling energy body: domain-warped fbm drifting in a different direction per axis.
  vec3 warp = vec3(snoise(q + vec3(0.0, t * 0.3, 1.0)), snoise(q + vec3(5.0, 0.0, t * 0.25)),
                   snoise(q + vec3(t * 0.2, 9.0, 3.0)));
  float body = fbm(q + warp * 0.8 + vec3(t * 0.15));

  // Two families of arcs at different scales, flickering independently.
  float e1 = snoise(q * 1.3 + warp * 0.6 + vec3(0.0, t * 0.5, 0.0));
  float e2 = snoise(q * 2.4 + warp * 0.4 - vec3(t * 0.7, 0.0, 0.0));
  float flick1 = 0.65 + 0.35 * sin(t * 9.0 + e2 * 7.0);
  float flick2 = 0.55 + 0.45 * sin(t * 13.0 + e1 * 9.0);
  float arcs = arc(e1, uArcWidth) * flick1 + 0.7 * arc(e2, uArcWidth * 0.8) * flick2;

  // Clicking discharges extra energy under the finger.
  arcs += abs(vImpact) * uImpactReact;

  vec3 col = uColorA * 0.12;                                   // faint body so the shape reads
  col += mix(uColorA, uColorB, body) * pow(body, 1.8) * 0.9;   // glowing clouds
  col += mix(uColorB, uColorCore, clamp(arcs, 0.0, 1.0)) * arcs * 1.6; // filaments
  col += uColorB * fresnel * 0.7;                              // corona on the rim
  col *= uGlow;

  // Soft tonemap so overlapping arcs saturate to white instead of clipping.
  col = 1.0 - exp(-col);

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
