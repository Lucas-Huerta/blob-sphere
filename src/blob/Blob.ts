import * as THREE from 'three';
import { blendThreshold, patchForBlend } from '@/blob/blend';
import type { MaterialContext, MaterialDef } from '@/materials/types';

const MAX_IMPACTS = 3;
/** Seconds after which a click no longer influences the surface. */
const IMPACT_LIFETIME = 3;
/** Spring constants of the whole-body recoil. */
const RECOIL_STIFFNESS = 90;
const RECOIL_DAMPING = 7;

export class Blob {
  readonly mesh: THREE.Mesh;

  /** Uniform objects shared by every material, so a swap keeps ongoing impacts. */
  private impactUniforms = {
    uImpacts: { value: Array.from({ length: MAX_IMPACTS }, () => new THREE.Vector4(0, 0, 1, -1)) },
    uImpactStrength: { value: new Array<number>(MAX_IMPACTS).fill(0) },
    uGrab: { value: new THREE.Vector4(0, 0, 1, 0) },
    uGrabDrag: { value: new THREE.Vector3() },
  };
  private grabHeld = false;
  private grabTarget = new THREE.Vector3(0, 0, 1);
  private grabCurrent = new THREE.Vector3(0, 0, 1);
  private grabStrength = 0;
  private impactStart = new Array<number>(MAX_IMPACTS).fill(-1);
  private nextImpact = 0;
  private time = 0;
  private velocity = new THREE.Vector3();
  private raycaster = new THREE.Raycaster();

  /** Where the body rests (the recoil spring pulls towards it); moved by an open hand. */
  private anchor = new THREE.Vector3();
  /** Max distance (world units) the blob can be carried from the centre. */
  private static readonly REACH = new THREE.Vector2(1.9, 1.1);

  /** Animation speed multiplier (scales shader time and the idle rotation). */
  speed = 1;
  /** Called whenever the primary or the blend material instance changes. */
  onMaterialsChanged?: () => void;

  private animTime = 0;
  private blendDef: MaterialDef | null = null;
  private blendMesh: THREE.Mesh;
  private partnerMaterial: THREE.ShaderMaterial | null = null;
  private blendAmount = 0;
  /** Dissolve threshold and per-mesh shape weights, shared by the two blended materials. */
  private blendUniforms = {
    uBlend: { value: blendThreshold(0) },
    shapeA: { value: 0 },
    shapeB: { value: 1 },
  };

  /** Scales down motion for prefers-reduced-motion. */
  motionScale = 1;

  /** Extra yaw (radians) driven by the carousel transition. */
  spin = 0;

  constructor(def: MaterialDef, private ctx: MaterialContext) {
    const geometry = new THREE.IcosahedronGeometry(1, 64);
    this.mesh = new THREE.Mesh(geometry, def.create(this.ctx));
    this.attachShared(this.material, true);
    // The partner of a blend rides along as a child so it follows every transform of the body.
    this.blendMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial()); // placeholder until used
    this.blendMesh.visible = false;
    this.mesh.add(this.blendMesh);
  }

  get material(): THREE.ShaderMaterial {
    return this.mesh.material as THREE.ShaderMaterial;
  }

  setMaterial(def: MaterialDef): void {
    this.material.dispose();
    const next = def.create(this.ctx);
    this.attachShared(next, true);
    this.mesh.material = next;
    this.onMaterialsChanged?.();
  }

  /** The material blended in on top of the primary one, if it has been created yet. */
  get blendMaterial(): THREE.ShaderMaterial | null {
    return this.partnerMaterial;
  }

  get blendWith(): MaterialDef | null {
    return this.blendDef;
  }

  get blendValue(): number {
    return this.blendAmount;
  }

  /** Choose the material blended with the primary one (`null` for none). */
  setBlendWith(def: MaterialDef | null): void {
    if (def === this.blendDef) return;
    this.blendDef = def;
    this.disposeBlendMaterial();
    this.syncBlend();
    this.onMaterialsChanged?.();
  }

  /** 0 = primary material only, 1 = partner only; in between the two dissolve into each other. */
  setBlendAmount(amount: number): void {
    this.blendAmount = THREE.MathUtils.clamp(amount, 0, 1);
    this.syncBlend();
  }

  private disposeBlendMaterial(): void {
    this.partnerMaterial?.dispose();
    this.partnerMaterial = null;
    this.blendMesh.visible = false;
  }

  /** Create the partner material lazily (only once the slider leaves 0) and show/hide its mesh. */
  private syncBlend(): void {
    const active = this.blendDef !== null && this.blendAmount > 0;
    if (active && !this.blendMaterial) {
      const material = this.blendDef!.create(this.ctx);
      this.attachShared(material, false);
      this.partnerMaterial = material;
      this.blendMesh.material = material;
      this.onMaterialsChanged?.();
    }
    this.blendMesh.visible = active;
    this.blendUniforms.uBlend.value = blendThreshold(active ? this.blendAmount : 0);
    this.blendUniforms.shapeA.value = active ? this.blendAmount : 0;
    this.blendUniforms.shapeB.value = active ? 1 - this.blendAmount : 0;
  }

  /**
   * Click the blob: cast a ray from the camera through `ndc`. On a hit, dent the
   * surface at that point and kick the whole body away from the finger.
   * Returns whether the blob was hit.
   */
  pokeAt(ndc: THREE.Vector2, camera: THREE.Camera, strength = 1): boolean {
    this.mesh.updateMatrixWorld();
    this.raycaster.setFromCamera(ndc, camera);
    const hit = this.raycaster.intersectObject(this.mesh, false)[0];
    if (!hit) return false;

    const s = strength * this.motionScale;
    const local = this.mesh.worldToLocal(hit.point.clone()).normalize();
    const i = this.nextImpact;
    this.nextImpact = (i + 1) % MAX_IMPACTS;
    this.impactUniforms.uImpacts.value[i].set(local.x, local.y, local.z, 0);
    this.impactUniforms.uImpactStrength.value[i] = s;
    this.impactStart[i] = this.time;

    // Newton's third law: shove the body along the ray direction.
    this.velocity.addScaledVector(this.raycaster.ray.direction, 1.1 * s);
    return true;
  }

  /**
   * Hold the surface under the cursor. Call on press and on every move while pressed:
   * the grab point follows the cursor with a springy lag, stretching the surface.
   * A cursor off the blob keeps pulling towards the nearest silhouette point.
   */
  grab(ndc: THREE.Vector2, camera: THREE.Camera): void {
    this.mesh.updateMatrixWorld();
    this.raycaster.setFromCamera(ndc, camera);
    const ray = this.raycaster.ray;
    const sphere = new THREE.Sphere(this.mesh.position, this.mesh.scale.x);
    // Hit on the sphere, or else the closest ray point to the centre (cursor off the blob).
    const world = ray.intersectSphere(sphere, new THREE.Vector3()) ?? ray.closestPointToPoint(sphere.center, new THREE.Vector3());
    const local = this.mesh.worldToLocal(world).normalize();
    this.grabTarget.copy(local);
    if (!this.grabHeld) {
      this.grabCurrent.copy(local);
      this.grabHeld = true;
    }
  }

  releaseGrab(): void {
    this.grabHeld = false;
  }

  /** Carry the whole blob towards `ndc` (open hand); `null` lets it return to the centre. */
  carryTo(ndc: THREE.Vector2 | null): void {
    if (!ndc) return void this.anchor.set(0, 0, 0);
    const reach = Blob.REACH;
    this.anchor.set(
      THREE.MathUtils.clamp(ndc.x, -1, 1) * reach.x * this.motionScale,
      THREE.MathUtils.clamp(ndc.y, -1, 1) * reach.y * this.motionScale,
      0,
    );
  }

  update(time: number): void {
    const dt = Math.min(time - this.time, 0.05);
    this.time = time;

    const impacts = this.impactUniforms.uImpacts.value;
    for (let i = 0; i < MAX_IMPACTS; i++) {
      const age = this.impactStart[i] < 0 ? -1 : time - this.impactStart[i];
      if (age > IMPACT_LIFETIME) this.impactStart[i] = -1;
      impacts[i].w = this.impactStart[i] < 0 ? -1 : age;
    }

    // Grab: lagging point chases the target; grip fades in/out.
    const catchUp = 1 - Math.exp(-dt * 9);
    this.grabCurrent.lerp(this.grabTarget, catchUp).normalize();
    const goal = this.grabHeld ? this.motionScale : 0;
    this.grabStrength += (goal - this.grabStrength) * (1 - Math.exp(-dt * (this.grabHeld ? 14 : 7)));
    const grab = this.impactUniforms.uGrab.value;
    grab.set(this.grabCurrent.x, this.grabCurrent.y, this.grabCurrent.z, this.grabStrength);
    const drag = this.impactUniforms.uGrabDrag.value.copy(this.grabTarget).sub(this.grabCurrent).multiplyScalar(1.4);
    if (drag.length() > 0.55) drag.setLength(0.55);

    // Damped spring pulling the body back to the origin.
    const pos = this.mesh.position;
    this.velocity.addScaledVector(pos.clone().sub(this.anchor), -RECOIL_STIFFNESS * dt);
    this.velocity.multiplyScalar(Math.max(0, 1 - RECOIL_DAMPING * dt));
    pos.addScaledVector(this.velocity, dt);

    this.animTime += dt * this.speed;
    this.material.uniforms.uTime.value = this.animTime;
    const partner = this.blendMesh.visible ? this.blendMaterial : null;
    if (partner) {
      partner.uniforms.uTime.value = this.animTime;
      // Each material displaces with the mix of both shapes, so the two silhouettes coincide.
      const a = this.material.uniforms;
      const b = partner.uniforms;
      a.uOtherAmplitude.value = b.uAmplitude.value;
      a.uOtherFrequency.value = b.uFrequency.value;
      b.uOtherAmplitude.value = a.uAmplitude.value;
      b.uOtherFrequency.value = a.uFrequency.value;
    }
    // The blob leans towards where it is carried, as if turning to follow the hand.
    this.mesh.rotation.y = this.animTime * 0.1 + pos.x * 0.35 + this.spin;
    this.mesh.rotation.x = -pos.y * 0.35;
  }

  /** Wire the uniforms and shader patch every blob material needs (impacts, blend dissolve). */
  private attachShared(material: THREE.ShaderMaterial, primary: boolean): void {
    const u = material.uniforms;
    Object.assign(u, this.impactUniforms, {
      uBlend: this.blendUniforms.uBlend,
      uBlendSide: { value: primary ? 1 : -1 },
      uShapeBlend: primary ? this.blendUniforms.shapeA : this.blendUniforms.shapeB,
      uOtherAmplitude: { value: u.uAmplitude?.value ?? 0 },
      uOtherFrequency: { value: u.uFrequency?.value ?? 0 },
    });
    material.onBeforeCompile = patchForBlend;
  }
}
