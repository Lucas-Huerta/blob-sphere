#include ../../shaders/chunks/noise.glsl
#include ../../shaders/chunks/thinFilm.glsl

uniform samplerCube uEnvMap;
uniform float uTime;
uniform vec3 uBase;          // colour of the bare oil underneath
uniform float uThickness;    // mean film thickness (nm)
uniform float uThicknessVar; // how much the thickness varies across the surface
uniform float uSwirlScale;   // size of the marbling
uniform float uSwirlSpeed;
uniform float uFilmStrength; // brightness of the rainbow film
uniform float uGloss;
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
  float fresnel = 0.04 + 0.96 * pow(1.0 - facing, 5.0);

  // Marbling: the film thickness comes from a domain-warped, swirling noise field.
  float t = uTime * uSwirlSpeed;
  vec3 q = vObjPosition * uSwirlScale;
  vec3 w = vec3(snoise(q + vec3(0.0, t, 0.0)), snoise(q + vec3(5.2, 1.3 - t, 2.1)), snoise(q + vec3(t, 8.7, 3.4)));
  float field = snoise(q * 1.3 + w * 1.6 + vec3(0.0, 0.0, t));
  float thickness = uThickness * (1.0 + uThicknessVar * field);
  vec3 film = thinFilm(facing, thickness, 1.45);

  // Dark body: the film only shows as a coloured sheen on top of near-black oil.
  vec3 col = uBase;
  vec3 env = textureCube(uEnvMap, reflect(-v, n)).rgb;
  float reflectivity = 0.18 + 0.82 * fresnel;
  col += film * film * uFilmStrength * (0.25 + 0.75 * reflectivity) * (0.4 + 0.6 * dot(env, vec3(0.333)) + 0.2);
  col += env * fresnel * 0.5;

  // Sharp wet highlight.
  vec3 h = normalize(LIGHT + v);
  col += vec3(pow(max(dot(n, h), 0.0), uGloss)) * 0.9;

  // Clicking thins the film locally: a flash of colour where it is pressed.
  col += film * abs(vImpact) * uImpactReact;

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
