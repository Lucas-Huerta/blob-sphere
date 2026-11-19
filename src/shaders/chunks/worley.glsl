// Worley (cellular) noise on a jittered 3D grid, shared by materials that need cells.

vec3 hash33(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}

// F1: distance to the nearest feature point.
float worley(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  float d = 4.0;
  for (int z = -1; z <= 1; z++)
    for (int y = -1; y <= 1; y++)
      for (int k = -1; k <= 1; k++) {
        vec3 g = vec3(float(k), float(y), float(z));
        vec3 r = g + hash33(i + g) - f;
        d = min(d, dot(r, r));
      }
  return sqrt(d);
}

// F1 and F2 (distances to the nearest and second nearest feature points), plus the position
// of the nearest feature point in the same space as x. F2 - F1 is small near cell borders,
// and the feature point identifies the cell (hash33(floor(center)) is a stable per-cell id).
void worleyCell(vec3 x, out float f1, out float f2, out vec3 center) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  float d1 = 8.0;
  float d2 = 8.0;
  vec3 c = vec3(0.0);
  for (int z = -1; z <= 1; z++)
    for (int y = -1; y <= 1; y++)
      for (int k = -1; k <= 1; k++) {
        vec3 g = vec3(float(k), float(y), float(z));
        vec3 r = g + hash33(i + g) - f;
        float d = dot(r, r);
        if (d < d1) {
          d2 = d1;
          d1 = d;
          c = i + g + hash33(i + g);
        } else if (d < d2) {
          d2 = d;
        }
      }
  f1 = sqrt(d1);
  f2 = sqrt(d2);
  center = c;
}
