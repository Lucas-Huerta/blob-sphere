#include ./noise.glsl

uniform float uTime;
uniform float uAmplitude;
uniform float uFrequency;

// Material blend: shape parameters of the partner material, mixed in by uShapeBlend (0..1),
// so both blended meshes share the same silhouette.
uniform float uShapeBlend;
uniform float uOtherAmplitude;
uniform float uOtherFrequency;

// Base shape (see blob/shapes.ts). uShapeMode: 0 = unit sphere, 1 = low-poly icosahedron melting
// into the blob (uShapeMorph: 0 = crisp polyhedron, 1 = blob), 2 = free surface (torus, knot):
// there the vertices move along the geometry normal, and uShapeAmp scales the relief down to
// the thickness of the tube.
uniform float uShapeMode;
uniform float uShapeMorph;
uniform float uShapeAmp;

bool isSurfaceShape() { return uShapeMode > 1.5; }

// Point of the base shape that identifies a vertex: its direction on the sphere, or the
// position itself on free surfaces (where one direction can cross the shape twice).
vec3 blobPoint(vec3 p) { return isSurfaceShape() ? p : normalize(p); }

// Distance between two points returned by blobPoint(): an angle on the sphere (the click
// impacts are stored that way), the same value as a chord length on the unit sphere.
float blobAngle(vec3 a, vec3 b) {
  if (isSurfaceShape()) return 2.0 * asin(clamp(0.5 * distance(a, b), 0.0, 1.0));
  return acos(clamp(dot(a, b), -1.0, 1.0));
}

// Outward direction at a displaced vertex, and the scale of any relief added on top of it.
vec3 blobUp(vec3 displaced) { return isSurfaceShape() ? normal : normalize(displaced); }
float blobRelief() { return isSurfaceShape() ? uShapeAmp : 1.0; }

// Radius of an icosahedron (inradius POLY_INRADIUS) along the unit direction q:
// inradius / max over the 20 face normals of dot(q, n). By symmetry the maximum over the signs
// of each normal family is a sum of absolute values.
#define POLY_INRADIUS 0.9
float polyRadius(vec3 q) {
  const float A = 0.6180339887; // 1 / golden ratio
  const float B = 1.6180339887; // golden ratio
  vec3 a = abs(q);
  float m = a.x + a.y + a.z;
  m = max(m, a.y * A + a.z * B);
  m = max(m, a.x * B + a.z * A);
  m = max(m, a.x * A + a.y * B);
  return POLY_INRADIUS / (m * 0.5773502692);
}

// Click impacts: xyz = unit direction (object space), w = age in seconds (< 0 = inactive).
#define MAX_IMPACTS 3
uniform vec4 uImpacts[MAX_IMPACTS];
uniform float uImpactStrength[MAX_IMPACTS];

// Held pointer: xyz = lagging grab point (unit, object space), w = grip strength 0..1.
// uGrabDrag = vector from the grab point towards the cursor (how far the surface is stretched).
uniform vec4 uGrab;
uniform vec3 uGrabDrag;

float grabWeight(vec3 q) {
  float ang = blobAngle(q, uGrab.xyz);
  return exp(-ang * ang * 4.5) * uGrab.w;
}

// Signed radial displacement caused by clicks at point p of the unit sphere:
// a dent that rebounds like a damped spring, plus rings travelling over the surface.
float impactAt(vec3 p) {
  vec3 q = blobPoint(p);
  float sum = 0.0;
  for (int i = 0; i < MAX_IMPACTS; i++) {
    float age = uImpacts[i].w;
    if (age < 0.0) continue;
    float ang = blobAngle(q, uImpacts[i].xyz);
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

// Displaced position of a vertex p of the base shape.
vec3 displace(vec3 p) {
  float freq = mix(uFrequency, uOtherFrequency, uShapeBlend);
  float amp = mix(uAmplitude, uOtherAmplitude, uShapeBlend);
  float n = snoise(p * freq + vec3(0.0, 0.0, uTime * 0.4));
  vec3 d;
  if (isSurfaceShape()) {
    d = p + normal * ((n * amp + impactAt(p)) * uShapeAmp);
  } else {
    float radius = 1.0;
    float relief = 1.0;
    if (uShapeMode > 0.5) {
      // Crisp polyhedron: flat faces with only a hint of motion; melting brings the noise back.
      radius = mix(polyRadius(normalize(p)), 1.0, uShapeMorph);
      relief = mix(0.1, 1.0, uShapeMorph);
    }
    d = p * (radius + n * amp * relief + impactAt(p));
  }
  // Surface dragged towards the cursor, trailing behind it.
  d += uGrabDrag * grabWeight(blobPoint(p)) * 0.9;
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
  bool surface = isSurfaceShape();
  vec3 up = surface ? normal : p;
  vec3 helper = abs(up.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
  vec3 t1 = normalize(cross(up, helper));
  vec3 t2 = normalize(cross(up, t1));
  float e = 0.01;
  vec3 p1 = p + t1 * e;
  vec3 p2 = p + t2 * e;
  // On the sphere the neighbours are put back on it; free surfaces keep the (tiny) offset.
  if (!surface) {
    p1 = normalize(p1);
    p2 = normalize(p2);
  }
  vec3 d0 = BLOB_SURFACE(p);
  vec3 d1 = BLOB_SURFACE(p1);
  vec3 d2 = BLOB_SURFACE(p2);
  return normalize(cross(d1 - d0, d2 - d0));
}
