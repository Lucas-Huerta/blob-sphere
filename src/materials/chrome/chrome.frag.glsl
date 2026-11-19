uniform samplerCube uEnvMap;
uniform vec3 uTint;
uniform float uDispersion;
uniform float uContrast;
uniform float uF0;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 n = normalize(vWorldNormal);
  vec3 v = normalize(cameraPosition - vWorldPosition);
  vec3 r = reflect(-v, n);

  // Tiny per-channel offset on the reflection vector: liquid-metal colour fringing.
  vec3 env;
  env.r = textureCube(uEnvMap, normalize(r + n * uDispersion)).r;
  env.g = textureCube(uEnvMap, r).g;
  env.b = textureCube(uEnvMap, normalize(r - n * uDispersion)).b;

  // Contrast curve: deepens the dark reflections so highlights read as mercury.
  env = pow(max(env, 0.0), vec3(uContrast));

  // Schlick fresnel with a very high F0 (chrome is almost a perfect mirror).
  float cosT = max(dot(n, v), 0.0);
  float fresnel = uF0 + (1.0 - uF0) * pow(1.0 - cosT, 5.0);

  vec3 col = env * uTint * fresnel;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
