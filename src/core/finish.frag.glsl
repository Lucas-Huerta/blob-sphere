uniform sampler2D tDiffuse;
uniform float uAberration; // radial colour fringe, in uv at the very corner
uniform float uGrain;      // film grain strength
uniform float uTime;

varying vec2 vUv;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  // Chromatic aberration: red and blue are pushed apart, more so towards the edges.
  vec2 dir = vUv - 0.5;
  vec2 shift = dir * dot(dir, dir) * uAberration * 4.0;
  vec4 r = texture2D(tDiffuse, vUv + shift);
  vec4 g = texture2D(tDiffuse, vUv);
  vec4 b = texture2D(tDiffuse, vUv - shift);
  vec4 color = vec4(r.r, g.g, b.b, max(r.a, max(g.a, b.a)));

  // Grain, a little stronger where there is something to see so the empty background stays clean.
  float n = hash(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5;
  color.rgb += n * uGrain * (0.25 + color.a);

  // The canvas is composited as premultiplied alpha: keep glow (colour with no coverage) valid.
  color.rgb = max(color.rgb, 0.0);
  color.a = max(color.a, max(color.r, max(color.g, color.b)));
  gl_FragColor = color;
}
