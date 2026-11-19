#include ../../shaders/chunks/refraction.glsl

uniform samplerCube uEnvMap;
uniform vec3 uTint;
uniform float uIor;
uniform float uDispersion;
uniform float uExposure;
uniform float uImpactReact;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying float vImpact;

void main() {
  vec3 n = normalize(vWorldNormal);
  vec3 v = normalize(cameraPosition - vWorldPosition);

  // One refraction per colour channel, each with a slightly different IOR: dispersion.
  // Compressed glass: local index and dispersion rise where the impact passes.
  float stress = abs(vImpact) * uImpactReact;
  float ior = uIor + stress * 0.3;
  float disp = uDispersion * (1.0 + stress * 3.0);
  vec3 refracted;
  refracted.r = textureCube(uEnvMap, throughGlass(v, n, ior - disp)).r;
  refracted.g = textureCube(uEnvMap, throughGlass(v, n, ior)).g;
  refracted.b = textureCube(uEnvMap, throughGlass(v, n, ior + disp)).b;

  // Absorption tint stronger where the surface faces the viewer (thicker path).
  float facing = max(dot(n, v), 0.0);
  refracted *= mix(vec3(1.0), uTint, pow(facing, 0.6));

  // Surface reflection (dielectric fresnel, F0 ~ 0.04).
  vec3 reflected = textureCube(uEnvMap, reflect(-v, n)).rgb;
  float fresnel = 0.04 + 0.96 * pow(1.0 - facing, 5.0);

  vec3 col = mix(refracted, reflected, fresnel) * uExposure;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
