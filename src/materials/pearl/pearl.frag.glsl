#include ../../shaders/chunks/noise.glsl
#include ../../shaders/chunks/thinFilm.glsl

uniform samplerCube uEnvMap;
uniform float uTime;
uniform vec3 uBase;          // body colour of the pearl
uniform float uIridescence;  // strength of the nacre colour shift
uniform float uThickness;    // mean nacre layer thickness (nm)
uniform float uLayerScale;   // frequency of the layering pattern
uniform float uGloss;
uniform float uSheen;
uniform float uImpactReact;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vObjPosition;
varying float vImpact;

const vec3 LIGHT = normalize(vec3(0.5, 0.8, 0.6));

void main() {
  vec3 n = normalize(vWorldNormal);
  vec3 v = normalize(cameraPosition - vWorldPosition);
  float facing = max(dot(n, v), 0.0);
  float fresnel = 0.05 + 0.95 * pow(1.0 - facing, 5.0);

  // Nacre is made of stacked aragonite layers: stretched, slowly shifting noise bands
  // vary the film thickness, which is what gives the soft marbled colour patches.
  vec3 q = vObjPosition * vec3(uLayerScale, uLayerScale * 0.6, uLayerScale) + vec3(0.0, 0.0, uTime * 0.03);
  float layers = snoise(q + 0.6 * snoise(q * 0.7));
  float thickness = uThickness * (1.0 + 0.28 * layers);
  vec3 film = thinFilm(facing, thickness, 1.55);

  // Milky body: wrapped diffuse so the light bleeds a little, plus faint inner depth.
  float wrap = clamp((dot(n, LIGHT) + 0.6) / 1.6, 0.0, 1.0);
  float depth = 0.94 + 0.08 * snoise(vObjPosition * 1.4 - refract(-v, n, 0.8) * 0.5);
  vec3 col = uBase * (0.35 + 0.8 * wrap) * depth;

  // Pastel colour shift, stronger towards the silhouette (overtone), pale at the centre.
  float iri = uIridescence * (0.3 + 0.7 * (1.0 - facing));
  col += (film - 0.5) * iri;
  col = mix(col, col * (0.6 + film * 0.9), uIridescence * 0.4);

  // Soft broad sheen plus a tight highlight and a faint reflection of the environment.
  vec3 h = normalize(LIGHT + v);
  float spec = pow(max(dot(n, h), 0.0), uGloss);
  float sheen = pow(1.0 - facing, 2.5) * uSheen;
  vec3 env = textureCube(uEnvMap, reflect(-v, n)).rgb;
  col += vec3(spec) * 0.7 + film * sheen * 0.5 + env * fresnel * 0.55;

  // Clicking makes the pearl glow where it is pressed.
  col += film * abs(vImpact) * uImpactReact;

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
