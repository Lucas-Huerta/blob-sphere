#include ../../shaders/chunks/noise.glsl
#include ../../shaders/chunks/refraction.glsl

uniform samplerCube uEnvMap;
uniform vec3 uIceColor;      // tint of thin ice
uniform vec3 uDeepColor;     // tint of thick ice
uniform vec3 uFrostColor;    // colour of the frost layer and the cracks
uniform float uIor;
uniform float uAbsorption;
uniform float uFrostScale;   // grain size of the frost
uniform float uFrostBump;    // how much the frost scatters the refraction
uniform float uFrostBlur;    // blur of what is seen through frosted areas (0..1)
uniform float uFrostAmount;  // how much of the surface is frosted (0..1)
uniform float uCracks;
uniform float uImpactReact;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vObjPosition;
varying float vImpact;

const vec3 LIGHT = normalize(vec3(0.5, 0.8, 0.6));
const float MAX_LOD = 7.0; // mip count of the 256px environment cubemap

vec3 envLod(vec3 dir, float lod) {
  return textureLod(uEnvMap, dir, lod).rgb;
}

void main() {
  vec3 n = normalize(vWorldNormal);
  vec3 v = normalize(cameraPosition - vWorldPosition);
  float facing = max(dot(n, v), 0.0);
  float fresnel = 0.02 + 0.98 * pow(1.0 - facing, 5.0);

  // Patchy frost, heavier towards the silhouette. Pressing the ice melts it locally.
  float patches = 0.5 + 0.5 * snoise(vObjPosition * 1.4 + 4.0);
  float frost = clamp((patches * 1.2 - 0.25 + (1.0 - facing) * 0.5) * uFrostAmount * 1.6, 0.0, 1.0);
  frost /= 1.0 + abs(vImpact) * uImpactReact;

  // Frost grain scatters the surface normal: the micro-bumps behind the blurry refraction.
  vec3 gp = vObjPosition * uFrostScale;
  vec3 grain = vec3(snoise(gp), snoise(gp + 5.2), snoise(gp + 9.7));
  vec3 nb = normalize(n + grain * uFrostBump * frost);

  // What we see through the ice: refracted environment, blurrier where it is frosted.
  vec3 rd = throughGlass(v, nb, uIor);
  float lod = mix(0.3, uFrostBlur * MAX_LOD, frost);
  vec3 seen = envLod(rd, lod);

  // Thin edges look pale, thick centre looks deep blue (Beer-Lambert style).
  float thick = pow(facing, 0.8);
  vec3 tint = mix(uIceColor, uDeepColor, 1.0 - exp(-uAbsorption * thick));
  vec3 col = seen * tint;

  // Cracks and trapped bubbles seen inside: thin bright veins from a ridged noise, with a
  // parallax offset along the refracted view ray so they sit behind the surface.
  vec3 ip = vObjPosition - refract(-v, n, 1.0 / uIor) * 0.4;
  float vein = 1.0 - abs(snoise(ip * 3.0 + 0.5 * snoise(ip * 1.5)));
  float cracks = pow(max(vein, 0.0), 18.0) * uCracks * (1.0 - frost * 0.6);
  col += uFrostColor * cracks;

  // Frost layer itself: opaque, whitish, softly lit.
  float wrap = clamp((dot(n, LIGHT) + 0.5) / 1.5, 0.0, 1.0);
  vec3 frostCol = uFrostColor * (0.35 + 0.65 * wrap);
  col = mix(col, frostCol, frost * 0.7);

  // Glossy reflection on the clear parts, tiny glints on the frost grain.
  vec3 refl = envLod(reflect(-v, nb), mix(0.5, 3.0, frost));
  col = mix(col, refl, fresnel * (1.0 - frost * 0.5));
  vec3 h = normalize(LIGHT + v);
  float glint = pow(max(dot(nb, h), 0.0), mix(250.0, 60.0, frost));
  col += vec3(glint) * 0.8;

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
