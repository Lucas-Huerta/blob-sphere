// Refraction through a roughly spherical transparent body, shared by glass-like materials.
//
// Refracts through the front face, travels the "chord" of the body, then refracts again on
// the exit face. Falls back to internal reflection on total internal reflection.
//   v    unit vector from the surface towards the camera
//   n    unit outward surface normal
//   ior  refractive index of the body
// Returns the world-space direction in which the environment should be sampled.
vec3 throughGlass(vec3 v, vec3 n, float ior) {
  vec3 d = refract(-v, n, 1.0 / ior);
  // Exit normal of a sphere along the chord d starting at the entry point.
  vec3 nOut = normalize(n - 2.0 * dot(n, d) * d);
  vec3 r2 = refract(d, -nOut, ior);
  if (dot(r2, r2) < 1e-4) r2 = reflect(d, -nOut);
  return r2;
}
