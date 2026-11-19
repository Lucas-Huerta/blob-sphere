uniform samplerCube uEnvMap;
uniform vec3 uBase;      // the near-black body of the fluid
uniform vec3 uSheen;     // faint coloured sheen on the rim and the spike tips
uniform float uContrast;
uniform float uF0;
uniform float uExposure;
uniform float uTipGlow;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying float vImpact;
varying float vSpike;

const vec3 LIGHT = normalize(vec3(0.5, 0.8, 0.6));

void main() {
  vec3 n = normalize(vWorldNormal);
  vec3 v = normalize(cameraPosition - vWorldPosition);
  float cosT = max(dot(n, v), 0.0);

  // Black, wet and mirror-like: only the bright parts of the environment show up.
  vec3 env = textureCube(uEnvMap, reflect(-v, n)).rgb;
  env = pow(max(env, 0.0), vec3(uContrast));
  float F = uF0 + (1.0 - uF0) * pow(1.0 - cosT, 5.0);

  vec3 h = normalize(LIGHT + v);
  float spec = pow(max(dot(n, h), 0.0), 220.0);

  vec3 col = uBase * (0.4 + 0.6 * max(dot(n, LIGHT), 0.0));
  col += env * F * uExposure;
  col += vec3(spec) * 0.9;
  col += uSheen * pow(1.0 - cosT, 3.0) * 0.5;      // rim sheen
  col += uSheen * vSpike * uTipGlow;               // tips catch the light

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
