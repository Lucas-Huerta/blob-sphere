#include ../../shaders/chunks/noise.glsl
#include ../../shaders/chunks/worley.glsl

uniform float uTime;
uniform float uLength;
uniform float uDensity;     // strands per unit of object space
uniform float uThickness;   // strand radius at the root, as a fraction of a cell
uniform float uSway;        // wind movement of the tips
uniform float uVariation;   // per-strand colour variation
uniform float uClump;       // how much strands lean together in tufts
uniform float uSheen;
uniform vec3 uRoot;
uniform vec3 uTip;
uniform float uImpactReact;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vObjPosition;
varying vec3 vObjNormal;
varying vec3 vObjView;
varying float vImpact;

const vec3 LIGHT = normalize(vec3(0.5, 0.8, 0.6));
const int LAYERS = 28;

void main() {
  vec3 n = normalize(vWorldNormal);
  vec3 nObj = normalize(vObjNormal);
  vec3 v = normalize(cameraPosition - vWorldPosition);
  vec3 vObj = normalize(vObjView);
  float facing = max(dot(nObj, vObj), 0.12);

  // Volumetric shell marching: walk from the outer shell down towards the skin along the view
  // ray. At each depth the ray crosses a "layer" of height h (1 = tips, 0 = roots); the strand
  // there, if any, is the one rooted in the grid cell under that point on the skin.
  float dh = 1.0 / float(LAYERS);
  float stepLen = dh * uLength / facing;
  vec3 q = vObjPosition;
  vec3 colour = vec3(0.0);
  bool hit = false;
  float hitH = 0.0;

  for (int i = 0; i < LAYERS; i++) {
    float h = 1.0 - (float(i) + 0.5) * dh;
    // Point on the skin below q, plus wind and tuft lean growing towards the tips.
    vec3 skin = q - nObj * (h * uLength);
    vec3 cellSpace = skin * uDensity;
    vec3 cell = floor(cellSpace);
    vec3 rnd = hash33(cell);
    vec3 lean = vec3(snoise(skin * 2.0 + uTime * 0.4), snoise(skin * 2.0 + 7.3 + uTime * 0.37), snoise(skin * 2.0 + 13.1 - uTime * 0.3));
    lean = (lean * uSway + (hash33(floor(skin * uDensity * 0.18)) - 0.5) * uClump) * h * h;
    vec3 centre = cell + 0.3 + 0.4 * rnd;
    vec3 d = cellSpace - centre - lean * uDensity * uLength;
    d -= nObj * dot(d, nObj); // distance in the tangent plane
    float len = 0.55 + 0.45 * rnd.x; // strands have different lengths
    float radius = uThickness * mix(1.0, 0.15, h / len) ;
    if (h < len && length(d) < radius) {
      hit = true;
      hitH = h;
      float shade = mix(1.0 - uVariation, 1.0, rnd.y);
      float t = clamp(h / len, 0.0, 1.0);
      colour = mix(uRoot, uTip, smoothstep(0.0, 1.0, t)) * shade;
      // Roots sit in shadow; the side of a strand facing the light is brighter.
      colour *= 0.55 + 0.45 * pow(h, 0.6);
      break;
    }
    q -= vObj * stepLen;
  }

  if (!hit) {
    // Ray crossed every layer without touching a strand: the undercoat, unless we are grazing
    // the silhouette (then the ray never got near the skin): fuzzy edge.
    if (facing < 0.2) discard;
    colour = uRoot * 0.5;
    hitH = 0.0;
  }

  float wrap = clamp((dot(n, LIGHT) + 0.5) / 1.5, 0.0, 1.0);
  vec3 col = colour * (0.25 + 1.0 * wrap);
  // Soft backlit rim, typical of fuzz: strands catch light at grazing angles.
  col += uTip * pow(1.0 - max(dot(n, v), 0.0), 3.0) * uSheen * (0.3 + 0.7 * hitH);
  col += uTip * abs(vImpact) * uImpactReact * hitH;

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
