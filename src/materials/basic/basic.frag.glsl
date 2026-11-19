uniform vec3 uColor;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 n = normalize(vNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);
  float diffuse = max(dot(n, normalize(vec3(0.5, 0.8, 0.6))), 0.0);
  vec3 col = uColor * (0.25 + 0.75 * diffuse) + fresnel * vec3(0.6, 0.7, 1.0);
  gl_FragColor = vec4(col, 1.0);
}
