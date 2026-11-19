uniform sampler2D tDiffuse;
uniform float uRange; // how far above 1.0 the compressed highlights may reach

varying vec2 vUv;

// The materials were tuned for a clamped output, so some of them write colours far above 1.0
// (mirror highlights). Left as they are, these would bloom across the whole screen: everything
// up to 1.0 stays untouched, only the excess above it is squeezed into a small range.
void main() {
  vec4 c = texture2D(tDiffuse, vUv);
  vec3 excess = max(c.rgb - 1.0, 0.0);
  c.rgb = min(c.rgb, 1.0) + uRange * (1.0 - exp(-excess));
  gl_FragColor = c;
}
