#include ../../shaders/chunks/noise.glsl

uniform samplerCube uEnvMap;
uniform vec3 uGold;            // reflectance at normal incidence (F0), the gold colour
uniform float uRoughness;      // 0 = mirror, 1 = very blurry
uniform float uBrushFreq;      // density of the brushing lines
uniform float uBrushStrength;  // how much the lines bend the normal
uniform float uAniso;          // stretch of the reflection along the brushing direction
uniform float uContrast;       // deepens dark reflections so the gold reads richer
uniform float uExposure;
uniform float uImpactReact;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vObjPosition;
varying float vImpact;

const vec3 LIGHT = normalize(vec3(0.5, 0.8, 0.6));
const float MAX_LOD = 7.0; // mip count of the 256px environment cubemap

// Environment lookup with roughness-driven blur (cubemap mip level).
vec3 envLod(vec3 dir, float roughness) {
  return textureLod(uEnvMap, dir, roughness * MAX_LOD).rgb;
}

void main() {
  vec3 n = normalize(vWorldNormal);
  vec3 v = normalize(cameraPosition - vWorldPosition);

  // Lathe-style brushing: fine lines running around the Y axis. T follows the lines,
  // B crosses them; the lines bend the normal across themselves, which smears highlights.
  vec3 T = normalize(cross(vec3(0.0, 1.0, 0.0), n) + vec3(1e-4));
  vec3 B = normalize(cross(n, T));
  float lines = snoise(vec3(vObjPosition.x * 3.0, vObjPosition.y * uBrushFreq, vObjPosition.z * 3.0));
  lines += 0.5 * snoise(vec3(vObjPosition.x * 5.0, vObjPosition.y * uBrushFreq * 2.3, vObjPosition.z * 5.0));
  vec3 nb = normalize(n + B * lines * uBrushStrength);

  // Clicked areas get polished: roughness drops where the surface was pressed.
  float rough = uRoughness / (1.0 + abs(vImpact) * uImpactReact);

  float cosT = max(dot(nb, v), 0.0);
  vec3 r = reflect(-v, nb);

  // Anisotropic reflection: three taps stretched along the brushing direction.
  vec3 env = 0.5 * envLod(r, rough)
           + 0.25 * envLod(normalize(r + T * uAniso), rough)
           + 0.25 * envLod(normalize(r - T * uAniso), rough);

  env = pow(max(env, 0.0), vec3(uContrast));

  // Schlick fresnel with a coloured F0: metals tint their reflection.
  vec3 F = uGold + (1.0 - uGold) * pow(1.0 - cosT, 5.0);

  // Key light highlight, widened by roughness.
  vec3 h = normalize(LIGHT + v);
  float shininess = mix(400.0, 12.0, clamp(rough * 1.6, 0.0, 1.0));
  float spec = pow(max(dot(nb, h), 0.0), shininess) * (shininess + 8.0) / 60.0;

  vec3 col = env * F * uExposure + uGold * spec * 0.35 + uGold * 0.03;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
