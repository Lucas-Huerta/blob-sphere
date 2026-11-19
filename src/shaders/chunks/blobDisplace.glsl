#include ./noise.glsl

uniform float uTime;
uniform float uAmplitude;
uniform float uFrequency;

// Radial displacement of a point on the unit sphere.
vec3 displace(vec3 p) {
  float n = snoise(p * uFrequency + vec3(0.0, 0.0, uTime * 0.4));
  return p * (1.0 + n * uAmplitude);
}

// Object-space normal of the displaced surface (finite differences on two tangents).
vec3 blobNormal(vec3 p) {
  vec3 helper = abs(p.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
  vec3 t1 = normalize(cross(p, helper));
  vec3 t2 = normalize(cross(p, t1));
  float e = 0.01;
  vec3 d0 = displace(p);
  vec3 d1 = displace(normalize(p + t1 * e));
  vec3 d2 = displace(normalize(p + t2 * e));
  return normalize(cross(d1 - d0, d2 - d0));
}
