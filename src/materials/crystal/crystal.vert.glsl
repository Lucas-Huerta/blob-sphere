#include ../../shaders/chunks/blobDisplace.glsl

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying float vImpact;
varying vec3 vObjNormal;
varying mat3 vModelRot;

void main() {
  vec3 p = position;
  vec3 nObj = blobNormal(p);
  vObjNormal = nObj;
  vModelRot = mat3(modelMatrix);
  vImpact = impactAt(p);
  vWorldNormal = normalize(mat3(modelMatrix) * nObj);
  vec4 world = modelMatrix * vec4(displace(p), 1.0);
  vWorldPosition = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
