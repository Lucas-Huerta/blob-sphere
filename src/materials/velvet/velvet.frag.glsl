#include ../../shaders/chunks/noise.glsl

uniform vec3 uBase;           // colour of the cloth seen face-on
uniform vec3 uSheenColor;     // colour of the fibres lit at grazing angles
uniform float uSheenIntensity;
uniform float uSheenPower;    // how tightly the rim sheen hugs the silhouette
uniform float uSheenSharp;    // how tight the light-driven sheen lobe is
uniform float uFiberScale;    // density of the fibre grain
uniform float uFiberStrength;
uniform float uPileScale;     // size of the brushed patches
uniform float uPileStrength;
uniform float uImpactReact;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vObjPosition;
varying float vImpact;

const vec3 LIGHT_A = normalize(vec3(0.5, 0.8, 0.6));
const vec3 LIGHT_B = normalize(vec3(-0.7, 0.2, -0.5));

// "Charlie" style sheen lobe: peaks where the half vector is nearly perpendicular to the
// normal, i.e. fibres standing up and catching light at grazing angles (the opposite of a
// glossy highlight). Returns lobe value times a soft n.l term.
float sheenLobe(vec3 n, vec3 v, vec3 l) {
  vec3 h = normalize(l + v);
  float sinH = sqrt(max(1.0 - dot(n, h) * dot(n, h), 0.0));
  float nl = clamp((dot(n, l) + 0.4) / 1.4, 0.0, 1.0);
  return pow(sinH, uSheenSharp) * nl;
}

void main() {
  vec3 n = normalize(vWorldNormal);
  vec3 v = normalize(cameraPosition - vWorldPosition);
  float facing = max(dot(n, v), 0.0);

  // Brushed pile: large soft patches where the fibres lie flatter or stand up, plus fine
  // grain. Pressing the cloth leaves a mark by flattening the pile locally.
  float pile = snoise(vObjPosition * uPileScale + 3.0);
  pile += abs(vImpact) * uImpactReact;
  float grain = snoise(vObjPosition * uFiberScale) * 0.5 + 0.5;
  float fibre = 1.0 + (grain - 0.5) * 2.0 * uFiberStrength;
  float pileGain = 1.0 + pile * uPileStrength;

  // Soft, dark-ish body: velvet absorbs most of the light face-on.
  float wrapA = clamp((dot(n, LIGHT_A) + 0.5) / 1.5, 0.0, 1.0);
  float wrapB = clamp((dot(n, LIGHT_B) + 0.5) / 1.5, 0.0, 1.0);
  vec3 col = uBase * (0.08 + 0.45 * wrapA + 0.12 * wrapB) * fibre;

  // Rim sheen: fibres at the silhouette scatter light towards the viewer.
  float rim = pow(1.0 - facing, uSheenPower);
  // Light-driven sheen: brightest on the lit side, stretched across the surface.
  float lobe = sheenLobe(n, v, LIGHT_A) + 0.4 * sheenLobe(n, v, LIGHT_B);
  // Retroreflection: a faint glow when the light comes from behind the viewer.
  float retro = pow(max(dot(v, LIGHT_A), 0.0), 6.0) * (1.0 - facing) * 0.5;

  float sheen = (rim * (0.35 + 0.65 * wrapA) + lobe * 0.55 + retro) * uSheenIntensity;
  col += uSheenColor * sheen * pileGain * fibre;

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
