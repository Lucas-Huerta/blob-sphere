#include ../../shaders/chunks/noise.glsl

uniform samplerCube uEnvMap;
uniform float uTime;
uniform float uHueSpread;
uniform float uScanFrequency;
uniform float uScanSpeed;
uniform float uGrain;
uniform float uImpactReact;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vObjPosition;
varying float vImpact;

const float TAU = 6.28318530718;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// Cosine palette (Inigo Quilez): smooth full-spectrum rainbow from a single scalar.
vec3 rainbow(float t) {
  return 0.5 + 0.5 * cos(TAU * (t + vec3(0.0, 0.33, 0.67)));
}

void main() {
  vec3 n = normalize(vWorldNormal);
  vec3 v = normalize(cameraPosition - vWorldPosition);
  float facing = max(dot(n, v), 0.0);
  float fresnel = pow(1.0 - facing, 2.2);

  // Foil colour: the hue slides with the viewing angle, warped by slow noise and height.
  float warp = snoise(vObjPosition * 1.4 + vec3(0.0, uTime * 0.1, 0.0));
  float hue = facing * uHueSpread + warp * 0.35 + vObjPosition.y * 0.25 + uTime * 0.03;
  vec3 foil = rainbow(hue);

  // Horizontal scanlines drifting upwards, fixed in world space.
  float scan = 0.5 + 0.5 * sin(vWorldPosition.y * uScanFrequency - uTime * uScanSpeed);
  float lines = mix(0.5, 1.0, smoothstep(0.25, 0.75, scan));

  // A bright glitch band sweeping through the blob, shifting the hue as it passes.
  float bandPos = fract(uTime * 0.12) * 3.0 - 1.5;
  float band = smoothstep(0.18, 0.0, abs(vWorldPosition.y - bandPos));
  foil = mix(foil, rainbow(hue + 0.4), band);

  // Sparkling grain, re-rolled ~12 times per second.
  float g = hash12(floor(gl_FragCoord.xy * 0.5) + floor(uTime * 12.0));
  float sparkle = step(0.985, g) * uGrain;

  // Rare brightness flicker.
  float flicker = 0.93 + 0.07 * step(0.8, hash12(vec2(floor(uTime * 9.0), 3.0)));

  vec3 env = textureCube(uEnvMap, reflect(-v, n)).rgb;

  vec3 col = foil * (0.3 + fresnel * 1.3) * lines;
  col += env * foil * 0.35;
  col += band * foil * 0.6;
  col += sparkle;
  col *= flicker;

  // Clicks flare the foil where they land.
  col += foil * abs(vImpact) * uImpactReact;

  // Additive blending: alpha scales the colour, so the dark page shows through.
  float alpha = clamp(0.45 + fresnel * 0.6 + band * 0.3, 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
}
