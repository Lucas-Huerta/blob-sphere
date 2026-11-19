uniform vec3 uShadow;
uniform vec3 uMid;
uniform vec3 uLight;
uniform vec3 uInk;
uniform float uOutline;
uniform float uHalftone;
uniform float uImpactReact;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying float vImpact;

const vec3 LIGHT_DIR = normalize(vec3(0.5, 0.8, 0.6));

// Anti-aliased step: the transition width follows the pixel footprint.
float aaStep(float edge, float x) {
  float w = max(fwidth(x), 1e-4);
  return smoothstep(edge - w, edge + w, x);
}

void main() {
  vec3 n = normalize(vWorldNormal);
  vec3 v = normalize(cameraPosition - vWorldPosition);
  float facing = max(dot(n, v), 0.0);

  // Clicks push the light across the surface where they land.
  float ndl = dot(n, LIGHT_DIR) + vImpact * uImpactReact;

  // Three flat tones separated by hard (but anti-aliased) edges.
  vec3 col = uShadow;
  col = mix(col, uMid, aaStep(-0.15, ndl));
  col = mix(col, uLight, aaStep(0.35, ndl));

  // Halftone dots in the shadow band, in screen space on a 45 degree grid.
  vec2 g = mat2(0.7071, -0.7071, 0.7071, 0.7071) * gl_FragCoord.xy / 7.0;
  float dist = length(fract(g) - 0.5);
  float inShadow = 1.0 - aaStep(-0.15, ndl);
  float depth = clamp(-0.15 - ndl, 0.0, 1.0);
  float dots = (1.0 - aaStep(0.18 + depth * 0.45, dist)) * inShadow * uHalftone;
  col = mix(col, uShadow * 0.55, dots);

  // Hard white specular highlight.
  vec3 h = normalize(LIGHT_DIR + v);
  float spec = aaStep(0.965, dot(n, h));
  col = mix(col, vec3(1.0), spec * 0.95);

  // Soft rim light on the shadow side, drawn as a flat band.
  float rim = aaStep(0.72, 1.0 - facing) * (1.0 - aaStep(0.1, ndl));
  col = mix(col, uLight, rim * 0.6);

  // Ink outline on the silhouette.
  float ink = 1.0 - aaStep(uOutline, facing);
  col = mix(col, uInk, ink);

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
