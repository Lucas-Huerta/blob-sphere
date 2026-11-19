#include ../../shaders/chunks/worley.glsl
#include ../../shaders/chunks/refraction.glsl

uniform samplerCube uEnvMap;
uniform vec3 uGemColor;      // colour of light leaving thin parts of the gem
uniform vec3 uDeepColor;     // colour of light crossing the core
uniform float uFacets;       // facet density (cells across the normal sphere)
uniform float uFlatness;     // 0 = smooth blob, 1 = fully flat facets
uniform float uIor;
uniform float uDispersion;
uniform float uAbsorption;
uniform float uBrilliance;   // variation of brightness from facet to facet
uniform float uEdge;         // width of the bright facet edges
uniform float uSparkle;
uniform float uImpactReact;

varying vec3 vWorldPosition;
varying vec3 vObjNormal;
varying mat3 vModelRot;
varying float vImpact;

const vec3 LIGHT = normalize(vec3(0.5, 0.8, 0.6));
const float MAX_LOD = 7.0; // mip count of the 256px environment cubemap

vec3 envLod(vec3 dir, float lod) {
  return textureLod(uEnvMap, dir, lod).rgb;
}

void main() {
  vec3 v = normalize(cameraPosition - vWorldPosition);

  // Facets are the Voronoi cells of the *normal*: every pixel whose smooth normal falls in
  // the same cell shares one flat normal (the direction of that cell's feature point), so
  // the cuts stay glued to the blob as it wobbles and rotates.
  vec3 nSmooth = normalize(vObjNormal);
  float f1, f2;
  vec3 center;
  worleyCell(nSmooth * uFacets, f1, f2, center);
  vec3 nFlat = normalize(center);
  vec3 nObj = normalize(mix(nSmooth, nFlat, uFlatness));
  vec3 n = normalize(vModelRot * nObj);

  vec3 id = hash33(floor(center));
  float facing = max(dot(n, v), 0.0);
  float fresnel = 0.05 + 0.95 * pow(1.0 - facing, 5.0);

  // Light bent through the facet, split per channel (dispersion), then tinted by how much
  // stone it crossed.
  vec3 refracted;
  refracted.r = envLod(throughGlass(v, n, uIor - uDispersion), 0.6).r;
  refracted.g = envLod(throughGlass(v, n, uIor), 0.6).g;
  refracted.b = envLod(throughGlass(v, n, uIor + uDispersion), 0.6).b;
  vec3 tint = mix(uGemColor, uDeepColor, 1.0 - exp(-uAbsorption * pow(facing, 0.7)));
  vec3 col = refracted * tint * (1.0 - uBrilliance * 0.5 + uBrilliance * id.x);

  // Facets facing the viewer light up from inside, like the table of a cut stone.
  col += uGemColor * pow(facing, 10.0) * (0.3 + 0.7 * id.y);

  // Surface reflection of the environment on top.
  col = mix(col, envLod(reflect(-v, n), 0.5), fresnel);

  // Hard glints on the facets that mirror the key light.
  vec3 h = normalize(LIGHT + v);
  col += vec3(pow(max(dot(n, h), 0.0), 260.0)) * uSparkle;

  // Bright edges where two facets meet (F2 - F1 is small on cell borders).
  float border = f2 - f1;
  float edge = 1.0 - smoothstep(0.0, uEdge + 1.5 * fwidth(border), border);
  col += vec3(1.0) * edge * 0.55;

  // Clicks make the pressed facets flare.
  col += uGemColor * abs(vImpact) * uImpactReact;

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
