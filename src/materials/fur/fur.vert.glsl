#include ../../shaders/chunks/blobDisplace.glsl

uniform float uLength;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying float vImpact;
varying vec3 vObjPosition;
varying vec3 vObjNormal;
varying vec3 vObjView;

void main() {
  vec3 p = position;
  vImpact = impactAt(p);
  vec3 nObj = blobNormal(p);
  vec3 skin = displace(p);
  // The mesh is the OUTER fur shell; the fragment shader marches down towards the skin.
  vec3 outer = skin + nObj * uLength;
  vObjPosition = outer;
  vObjNormal = nObj;
  vObjView = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz - outer;
  vWorldNormal = normalize(mat3(modelMatrix) * nObj);
  vec4 world = modelMatrix * vec4(outer, 1.0);
  vWorldPosition = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
