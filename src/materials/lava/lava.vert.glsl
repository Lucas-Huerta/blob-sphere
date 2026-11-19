#include ../../shaders/chunks/blobDisplace.glsl

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vObjPosition;
varying float vImpact;

void main() {
  vec3 p = position;
  vObjPosition = p;
  vImpact = impactAt(p);
  vWorldNormal = normalize(mat3(modelMatrix) * blobNormal(p));
  vec4 world = modelMatrix * vec4(displace(p), 1.0);
  vWorldPosition = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
