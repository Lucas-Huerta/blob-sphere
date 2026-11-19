// The normals must follow the spikes: tell the shared chunk to sample ferroSurface().
vec3 ferroSurface(vec3 p);
#define BLOB_SURFACE(p) ferroSurface(p)
#include ../../shaders/chunks/blobDisplace.glsl
#include ../../shaders/chunks/worley.glsl

uniform float uSpikeHeight;
uniform float uSpikeScale;   // cells per unit: how many spikes cover the sphere
uniform float uSpikeRadius;  // footprint of one spike, in cell units
uniform float uSpikeSharp;   // >1 makes needle tips, <1 rounded bumps

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying float vImpact;
varying float vSpike;

// Spike height in 0..1 at a point of the base shape (blobPoint): one cone per Worley cell.
float spikeAt(vec3 q) {
  float cone = clamp(1.0 - worley(q * uSpikeScale) / uSpikeRadius, 0.0, 1.0);
  float h = pow(cone, uSpikeSharp);
  // Taller spikes in some regions, and a slow "breathing" as the field strength varies.
  h *= 0.65 + 0.35 * snoise(q * 1.7 + 2.0);
  h *= 0.9 + 0.1 * sin(uTime * 1.4);
  // Pressed areas flatten, rebounding areas grow.
  h *= clamp(1.0 + 5.0 * impactAt(q), 0.0, 1.8);
  return h;
}

vec3 ferroSurface(vec3 p) {
  vec3 d = displace(p);
  return d + blobUp(d) * spikeAt(blobPoint(p)) * uSpikeHeight * blobRelief();
}

void main() {
  vec3 p = position;
  vImpact = impactAt(p);
  vSpike = spikeAt(blobPoint(p));
  vWorldNormal = normalize(mat3(modelMatrix) * blobNormal(p));
  vec4 world = modelMatrix * vec4(ferroSurface(p), 1.0);
  vWorldPosition = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
