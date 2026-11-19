// Thin-film interference, shared by the iridescent materials.
//
// Reflectance modulation of a film for the R, G, B wavelengths (650 / 510 / 440 nm).
// Two-beam interference: optical path difference 2 * n * d * cos(theta_t), with the
// half-wave phase flip on reflection at the film's top surface.
//   cosTheta  cosine of the angle between normal and view direction
//   thickness film thickness in nm
//   ior       refractive index of the film
vec3 thinFilm(float cosTheta, float thickness, float ior) {
  const float PI = 3.14159265359;
  float sinT2 = (1.0 - cosTheta * cosTheta) / (ior * ior);
  float cosTt = sqrt(max(1.0 - sinT2, 0.0));
  float opd = 2.0 * ior * thickness * cosTt;
  vec3 lambda = vec3(650.0, 510.0, 440.0);
  vec3 phase = 2.0 * PI * opd / lambda + PI;
  return 0.5 - 0.5 * cos(phase);
}
