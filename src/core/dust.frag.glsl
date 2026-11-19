uniform vec3 uColor;
uniform float uOpacity;

varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float disc = smoothstep(1.0, 0.0, d);
  float a = disc * disc * vAlpha * uOpacity;
  if (a < 0.002) discard;
  gl_FragColor = vec4(uColor, a);
  #include <colorspace_fragment>
}
