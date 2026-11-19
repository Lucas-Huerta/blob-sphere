uniform float uTime;
uniform float uLatLines;     // parallels from pole to pole
uniform float uLonLines;     // meridians around the sphere
uniform float uLineWidth;    // line thickness in pixels
uniform float uGlow;
uniform float uScanSpeed;
uniform float uScanWidth;
uniform float uFill;         // strength of the dark translucent body
uniform float uImpactReact;
uniform vec3 uLineColor;
uniform vec3 uScanColor;
uniform vec3 uFillColor;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vObjPosition;
varying float vImpact;

const float PI = 3.14159265359;

float hash11(float x) {
  return fract(sin(x * 127.1) * 43758.5453);
}

// Anti-aliased line at every integer of x; `aa` is the pixel footprint of x.
float gridLine(float x, float aa) {
  float d = abs(fract(x - 0.5) - 0.5);
  return 1.0 - smoothstep(0.0, aa * uLineWidth, d);
}

void main() {
  vec3 n = normalize(vWorldNormal);
  vec3 v = normalize(cameraPosition - vWorldPosition);
  float facing = abs(dot(n, v));
  float fresnel = pow(1.0 - facing, 2.0);
  // The material is double sided: far-side lines show through, dimmer.
  float side = gl_FrontFacing ? 1.0 : 0.4;

  vec3 p = normalize(vObjPosition);
  float theta = acos(clamp(p.y, -1.0, 1.0)) / PI * uLatLines;
  float phi = atan(p.z, p.x) / (2.0 * PI) * uLonLines;

  // atan jumps at the seam, which would spike fwidth: use the smaller of two phases.
  float aaLat = fwidth(theta);
  float aaLon = min(fwidth(phi), fwidth(fract(phi + 0.5)));

  float lat = gridLine(theta, aaLat);
  float lon = gridLine(phi, aaLon);
  // Meridians converge at the poles: fade them out there so they do not clump.
  lon *= smoothstep(0.0, 0.3, sin(theta / uLatLines * PI));

  float lines = max(lat, lon);
  float nodes = lat * lon; // brighter where lines cross

  // A scan band sweeping upwards through the blob, in world space.
  float scanPos = fract(uTime * uScanSpeed) * 3.2 - 1.6;
  float band = exp(-pow((vWorldPosition.y - scanPos) / uScanWidth, 2.0));

  // Slow electrical flicker on the whole grid.
  float flicker = 0.92 + 0.08 * step(0.7, hash11(floor(uTime * 11.0)));

  vec3 col = uFillColor * uFill * (0.25 + fresnel * 1.2);                   // translucent body
  col += uLineColor * lines * uGlow * (1.0 + 3.0 * band) * side * flicker;  // grid
  col += uLineColor * nodes * uGlow * 0.8 * side;                           // nodes
  col += uScanColor * band * (0.25 + 0.6 * fresnel) * side;                 // scan glow
  col += uLineColor * fresnel * 0.35;                                       // rim
  col += uScanColor * abs(vImpact) * uImpactReact * lines;                  // clicks light the grid

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
