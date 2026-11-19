#include ../../shaders/chunks/noise.glsl

uniform samplerCube uEnvMap;
uniform float uTime;
uniform float uFilmIor;
uniform float uThicknessMin; // nm
uniform float uThicknessMax; // nm
uniform float uSwirlScale;
uniform float uIntensity;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vObjPosition;

const float PI = 3.14159265359;

// Reflectance modulation of a thin film for the R, G, B wavelengths (nm).
// Two-beam interference: optical path difference 2 * n * d * cos(theta_t).
vec3 thinFilm(float cosTheta, float thickness) {
  float sinT2 = (1.0 - cosTheta * cosTheta) / (uFilmIor * uFilmIor);
  float cosTt = sqrt(max(1.0 - sinT2, 0.0));
  float opd = 2.0 * uFilmIor * thickness * cosTt;
  vec3 lambda = vec3(650.0, 510.0, 440.0);
  // +PI: phase flip on reflection at the film's top surface.
  vec3 phase = 2.0 * PI * opd / lambda + PI;
  return 0.5 - 0.5 * cos(phase);
}

// Film thickness: domain-warped swirls, thinner at the top (soap drains downwards).
float filmThickness() {
  vec3 q = vObjPosition * uSwirlScale + vec3(0.0, uTime * 0.05, 0.0);
  vec3 warp = vec3(snoise(q + 3.1), snoise(q + 7.7), snoise(q + 11.3));
  float n = snoise(q + warp * 0.9);
  float t = 0.5 + 0.5 * n;
  t += -0.25 * vWorldPosition.y; // gravity
  return mix(uThicknessMin, uThicknessMax, clamp(t, 0.0, 1.0));
}

void main() {
  vec3 n = normalize(vWorldNormal);
  vec3 v = normalize(cameraPosition - vWorldPosition);
  float cosTheta = max(dot(n, v), 0.0);

  vec3 film = thinFilm(cosTheta, filmThickness());
  film = pow(film, vec3(1.4)); // push saturation

  vec3 env = textureCube(uEnvMap, reflect(-v, n)).rgb;
  float fresnel = 0.04 + 0.96 * pow(1.0 - cosTheta, 4.0);

  // Mostly transparent bubble: colour comes from the film modulating the reflection,
  // with a faint film tint everywhere and a stronger rim.
  vec3 col = env * film * uIntensity + film * 0.12 + film * fresnel * 0.6;
  float alpha = clamp(0.1 + fresnel * 0.9 + dot(col, vec3(0.333)) * 0.55, 0.0, 1.0);

  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
}
