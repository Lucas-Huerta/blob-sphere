#include ./noise.glsl

uniform float uTime;
uniform float uAmplitude;
uniform float uFrequency;

// Material blend: shape parameters of the partner material, mixed in by uShapeBlend (0..1),
// so both blended meshes share the same silhouette.
uniform float uShapeBlend;
uniform float uOtherAmplitude;
uniform float uOtherFrequency;

// Click impacts: xyz = unit direction (object space), w = age in seconds (< 0 = inactive).
#define MAX_IMPACTS 3
uniform vec4 uImpacts[MAX_IMPACTS];
uniform float uImpactStrength[MAX_IMPACTS];

// Held pointer: xyz = lagging grab point (unit, object space), w = grip strength 0..1.
// uGrabDrag = vector from the grab point towards the cursor (how far the surface is stretched).
uniform vec4 uGrab;
uniform vec3 uGrabDrag;

float grabWeight(vec3 q) {
  float ang = acos(clamp(dot(q, uGrab.xyz), -1.0, 1.0));
  return exp(-ang * ang * 4.5) * uGrab.w;
}

// Signed radial displacement caused by clicks at point p of the unit sphere:
// a dent that rebounds like a damped spring, plus rings travelling over the surface.
float impactAt(vec3 p) {
  vec3 q = normalize(p);
  float sum = 0.0;
  for (int i = 0; i < MAX_IMPACTS; i++) {
    float age = uImpacts[i].w;
    if (age < 0.0) continue;
    float ang = acos(clamp(dot(q, uImpacts[i].xyz), -1.0, 1.0));
    // Pressed in first (-1), then overshoots outwards and settles.
    float spring = -exp(-age * 5.0) * cos(age * 16.0);
    float dent = spring * exp(-ang * ang * 7.0);
    // Ring leaving the impact point; fades with distance and time.
    float front = age * 3.2;
    float ring = sin(ang * 13.0 - age * 22.0)
      * exp(-age * 2.6)
      * exp(-ang * 0.9)
      * smoothstep(front + 0.15, front - 0.35, ang);
    sum += (dent * 0.26 + ring * 0.05) * uImpactStrength[i];
  }
  // Pressed in under the finger, more so while stretching.
  sum -= grabWeight(q) * (0.07 + 0.2 * length(uGrabDrag));
  return sum;
}

// Radial displacement of a point on the unit sphere.
vec3 displace(vec3 p) {
  float freq = mix(uFrequency, uOtherFrequency, uShapeBlend);
  float amp = mix(uAmplitude, uOtherAmplitude, uShapeBlend);
  float n = snoise(p * freq + vec3(0.0, 0.0, uTime * 0.4));
  vec3 d = p * (1.0 + n * amp + impactAt(p));
  // Surface dragged towards the cursor, trailing behind it.
  d += uGrabDrag * grabWeight(normalize(p)) * 0.9;
  return d;
}

// Surface sampled for the normals. A material that adds its own relief on top of displace()
// (spikes, ripples...) defines BLOB_SURFACE(p) before including this chunk, forward-declaring
// the function it expands to, so normals follow that relief too.
#ifndef BLOB_SURFACE
#define BLOB_SURFACE(p) displace(p)
#endif

// Object-space normal of the displaced surface (finite differences on two tangents).
vec3 blobNormal(vec3 p) {
  vec3 helper = abs(p.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
  vec3 t1 = normalize(cross(p, helper));
  vec3 t2 = normalize(cross(p, t1));
  float e = 0.01;
  vec3 d0 = BLOB_SURFACE(p);
  vec3 d1 = BLOB_SURFACE(normalize(p + t1 * e));
  vec3 d2 = BLOB_SURFACE(normalize(p + t2 * e));
  return normalize(cross(d1 - d0, d2 - d0));
}
