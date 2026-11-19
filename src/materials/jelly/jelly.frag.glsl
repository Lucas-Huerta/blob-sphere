#include ../../shaders/chunks/noise.glsl

uniform samplerCube uEnvMap;
uniform float uTime;
uniform vec3 uColorLight;   // colour of thin parts (light scattered through little jelly)
uniform vec3 uColorDeep;    // colour of thick parts (absorbed light)
uniform float uAbsorption;
uniform float uWrap;
uniform float uTransmission;
uniform float uGloss;
uniform float uImpactReact;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vObjPosition;
varying float vImpact;

const vec3 LIGHT_A = normalize(vec3(0.5, 0.8, 0.6));
const vec3 LIGHT_B = normalize(vec3(-0.7, 0.2, -0.5));

void main() {
  vec3 n = normalize(vWorldNormal);
  vec3 v = normalize(cameraPosition - vWorldPosition);
  float facing = max(dot(n, v), 0.0);
  float fresnel = 0.05 + 0.95 * pow(1.0 - facing, 5.0);

  // Path length through the jelly: long face-on, short at the silhouette.
  // A drifting inner density makes it look like it has a body, not a surface.
  vec3 inner = vObjPosition - refract(-v, n, 0.75) * 0.5;
  float density = 0.5 + 0.5 * snoise(inner * 1.8 + vec3(0.0, uTime * 0.08, 0.0));
  float thickness = facing * (0.75 + 0.5 * density);
  thickness = max(thickness - abs(vImpact) * uImpactReact, 0.0); // pressed jelly thins out

  // Beer-Lambert style absorption: thin = light colour, thick = deep colour.
  float absorbed = 1.0 - exp(-uAbsorption * thickness);
  vec3 body = mix(uColorLight, uColorDeep, absorbed);

  // Subsurface approximation: wrapped diffuse (light bleeds past the terminator)...
  float wrapA = clamp((dot(n, LIGHT_A) + uWrap) / (1.0 + uWrap), 0.0, 1.0);
  float wrapB = clamp((dot(n, LIGHT_B) + uWrap) / (1.0 + uWrap), 0.0, 1.0);
  vec3 diffuse = body * (0.25 + 0.9 * wrapA + 0.35 * wrapB);

  // ...plus light transmitted from behind, tinted by the light colour and strongest on thin edges.
  float back = pow(clamp(dot(v, -normalize(LIGHT_A + n * 0.6)), 0.0, 1.0), 2.5);
  vec3 transmitted = uColorLight * back * (1.0 - absorbed * 0.6) * uTransmission;

  // Wet, glossy surface: sharp Blinn-Phong highlights + soft environment reflection.
  vec3 h = normalize(LIGHT_A + v);
  float spec = pow(max(dot(n, h), 0.0), uGloss);
  vec3 env = textureCube(uEnvMap, reflect(-v, n)).rgb;

  vec3 col = diffuse + transmitted + vec3(spec) * 0.9 + env * fresnel * 0.6;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
