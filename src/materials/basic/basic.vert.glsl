#include ../../shaders/chunks/blobDisplace.glsl

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vImpact;

void main() {
  vec3 p = position;
  vImpact = impactAt(p);
  vNormal = normalize(normalMatrix * blobNormal(p));
  vec4 world = modelMatrix * vec4(displace(p), 1.0);
  vWorldPosition = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
