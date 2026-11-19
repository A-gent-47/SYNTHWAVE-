import * as THREE from 'three';
import { VisualizerScene } from './SceneBase';
import { AudioMetrics } from '../../audio/types';
import { ColorPalette } from '../presets';
import { useVisualizerStore } from '../../store/visualizerStore';

export class ParticleUniverseScene implements VisualizerScene {
  public id = 'particle-universe';
  public name = '02 // CELESTIAL NEBULA';

  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;

  // Population A: Accretion Spiral Disk (3500 particles)
  private diskMesh: THREE.Points | null = null;
  private diskGeo: THREE.BufferGeometry | null = null;
  private diskOriginalPos: Float32Array | null = null;
  private diskRadii: Float32Array | null = null;
  private diskThetas: Float32Array | null = null;
  private diskSpeeds: Float32Array | null = null;
  private readonly diskCount = 3500;

  // Population B: Braided Toroidal Filaments (2500 particles)
  private filamentMesh: THREE.Points | null = null;
  private filamentGeo: THREE.BufferGeometry | null = null;
  private filamentOriginalPos: Float32Array | null = null;
  private filamentPhases: Float32Array | null = null;
  private readonly filamentCount = 2500;

  // Population C: Deep Field Stellar Halo (1500 particles)
  private haloMesh: THREE.Points | null = null;
  private haloGeo: THREE.BufferGeometry | null = null;
  private readonly haloCount = 1500;

  // Sculptural Dual-Geodesic Pulsar Core
  private coreOuterMesh: THREE.Mesh | null = null;
  private coreInnerMesh: THREE.Mesh | null = null;
  private coreLight: THREE.PointLight | null = null;
  private ambientLight: THREE.AmbientLight | null = null;

  // Shockwave Propagation Dynamics
  private shockwaveRadius = 0;
  private shockwaveIntensity = 0;

  // Base Camera
  private readonly baseFov = 60;
  private camAngle = 0;

  public init(scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
    this.scene = scene;
    this.camera = camera;

    this.camera.position.set(0, 3.2, 11.0);
    this.camera.lookAt(0, 0, 0);
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();

    // Deep space atmospheric fog
    scene.fog = new THREE.FogExp2(0x04020a, 0.016);

    // Setup Lighting
    this.ambientLight = new THREE.AmbientLight(0x100820, 1.4);
    scene.add(this.ambientLight);

    this.coreLight = new THREE.PointLight(0x00f0ff, 5.0, 35);
    this.coreLight.position.set(0, 0, 0);
    scene.add(this.coreLight);

    // Build Particle Populations
    this.setupAccretionDisk();
    this.setupFilaments();
    this.setupHalo();

    // Build Sculptural Core
    this.setupCore();
  }

  private setupAccretionDisk(): void {
    if (!this.scene) return;

    const positions = new Float32Array(this.diskCount * 3);
    const colors = new Float32Array(this.diskCount * 3);
    this.diskOriginalPos = new Float32Array(this.diskCount * 3);
    this.diskRadii = new Float32Array(this.diskCount);
    this.diskThetas = new Float32Array(this.diskCount);
    this.diskSpeeds = new Float32Array(this.diskCount);

    const colPrimary = new THREE.Color(0x00f0ff);
    const colSecondary = new THREE.Color(0xff007f);
    const colCore = new THREE.Color(0xffffff);

    for (let i = 0; i < this.diskCount; i++) {
      // 3-arm logarithmic spiral with Keplerian falloff
      const arm = (i % 3) * ((Math.PI * 2) / 3);
      const rNorm = Math.pow(Math.random(), 0.7);
      const r = 0.8 + rNorm * 7.5;
      const theta = r * 0.85 + arm + (Math.random() - 0.5) * 0.45;
      const y = (Math.random() - 0.5) * (0.8 / (r * 0.3 + 0.7));

      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      this.diskOriginalPos[i * 3] = x;
      this.diskOriginalPos[i * 3 + 1] = y;
      this.diskOriginalPos[i * 3 + 2] = z;

      this.diskRadii[i] = r;
      this.diskThetas[i] = theta;
      // Keplerian angular velocity (v proportional to 1/sqrt(r))
      this.diskSpeeds[i] = 1.2 / Math.sqrt(r);

      // Color gradient from bright core to deep arms
      const cLerp = Math.min(1.0, r / 6.0);
      const c = r < 1.8 ? colCore : colPrimary.clone().lerp(colSecondary, cLerp);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    this.diskGeo = new THREE.BufferGeometry();
    this.diskGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.diskGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.diskMesh = new THREE.Points(this.diskGeo, mat);
    this.scene.add(this.diskMesh);
  }

  private setupFilaments(): void {
    if (!this.scene) return;

    const positions = new Float32Array(this.filamentCount * 3);
    const colors = new Float32Array(this.filamentCount * 3);
    this.filamentOriginalPos = new Float32Array(this.filamentCount * 3);
    this.filamentPhases = new Float32Array(this.filamentCount);

    const colViolet = new THREE.Color(0x8b00ff);
    const colCyan = new THREE.Color(0x00f0ff);

    for (let i = 0; i < this.filamentCount; i++) {
      const strand = i % 4;
      const t = (i / this.filamentCount) * Math.PI * 4;
      const r = 2.5 + Math.sin(t * 2 + strand) * 1.5;
      const angle = t + strand * (Math.PI / 2);

      const x = Math.cos(angle) * r;
      const y = Math.sin(t * 3) * 2.8;
      const z = Math.sin(angle) * r;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      this.filamentOriginalPos[i * 3] = x;
      this.filamentOriginalPos[i * 3 + 1] = y;
      this.filamentOriginalPos[i * 3 + 2] = z;

      this.filamentPhases[i] = t;

      const col = colViolet.clone().lerp(colCyan, (Math.sin(t) + 1) * 0.5);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    this.filamentGeo = new THREE.BufferGeometry();
    this.filamentGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.filamentGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.065,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.filamentMesh = new THREE.Points(this.filamentGeo, mat);
    this.scene.add(this.filamentMesh);
  }

  private setupHalo(): void {
    if (!this.scene) return;

    const positions = new Float32Array(this.haloCount * 3);
    const colors = new Float32Array(this.haloCount * 3);

    const colWhite = new THREE.Color(0xffffff);
    const colSlate = new THREE.Color(0x4361ee);

    for (let i = 0; i < this.haloCount; i++) {
      const r = 8.0 + Math.pow(Math.random(), 0.6) * 16.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.cos(phi) * r * 0.6;
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;

      const c = Math.random() < 0.65 ? colWhite : colSlate;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    this.haloGeo = new THREE.BufferGeometry();
    this.haloGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.haloGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.haloMesh = new THREE.Points(this.haloGeo, mat);
    this.scene.add(this.haloMesh);
  }

  private setupCore(): void {
    if (!this.scene) return;

    // Outer cage: wireframe icosahedron
    const outerGeo = new THREE.IcosahedronGeometry(1.4, 1);
    const outerMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      wireframe: true,
      emissive: 0x00a0cc,
      emissiveIntensity: 1.4,
      roughness: 0.2,
      metalness: 0.9
    });
    this.coreOuterMesh = new THREE.Mesh(outerGeo, outerMat);
    this.scene.add(this.coreOuterMesh);

    // Inner glowing dodecahedron
    const innerGeo = new THREE.DodecahedronGeometry(0.85);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xff007f,
      emissive: 0xff007f,
      emissiveIntensity: 2.2,
      roughness: 0.1,
      metalness: 0.7
    });
    this.coreInnerMesh = new THREE.Mesh(innerGeo, innerMat);
    this.scene.add(this.coreInnerMesh);
  }

  public update(elapsedTime: number, deltaTime: number, metrics: AudioMetrics): void {
    const store = useVisualizerStore.getState();
    const isPlaying = metrics.overall > 0.01;
    const speedMult = store.motionSpeed * (isPlaying ? 1.0 + metrics.mid * 0.7 : 0.25);
    const beatPulse = (typeof metrics.beatPulse === 'number') ? metrics.beatPulse : 0;
    const bassPulse = beatPulse * store.bassSensitivity;
    const shakeMult = store.cameraShake ? store.cameraShakeIntensity : 0.0;

    // 1. Bass Drop Shockwave Trigger & Propagation
    if (metrics.isBeat && metrics.rawBass > 0.45) {
      this.shockwaveRadius = 0.5;
      this.shockwaveIntensity = 1.0;
    }
    if (this.shockwaveIntensity > 0.01) {
      this.shockwaveRadius += deltaTime * 14.0 * speedMult;
      this.shockwaveIntensity = THREE.MathUtils.lerp(this.shockwaveIntensity, 0, deltaTime * 2.8);
    }

    // 2. Animate Accretion Disk Particles
    if (this.diskGeo && this.diskOriginalPos && this.diskRadii && this.diskThetas && this.diskSpeeds) {
      const posAttr = this.diskGeo.attributes.position;
      const positions = posAttr.array as Float32Array;

      for (let i = 0; i < this.diskCount; i++) {
        // Continuous orbital rotation
        this.diskThetas[i] += this.diskSpeeds[i] * deltaTime * 0.6 * speedMult;
        const theta = this.diskThetas[i];
        let r = this.diskRadii[i];

        // Shockwave displacement
        const dDiff = Math.abs(r - this.shockwaveRadius);
        if (dDiff < 1.4 && this.shockwaveIntensity > 0.02) {
          r += (1.4 - dDiff) * 0.7 * this.shockwaveIntensity;
        }

        // Mids harmonic wave
        const wave = Math.sin(r * 2.0 - elapsedTime * 3.5) * metrics.mid * 0.25;

        positions[i * 3] = Math.cos(theta) * r;
        positions[i * 3 + 1] = this.diskOriginalPos[i * 3 + 1] + wave;
        positions[i * 3 + 2] = Math.sin(theta) * r;
      }
      posAttr.needsUpdate = true;
    }

    // 3. Animate Braided Filaments
    if (this.filamentGeo && this.filamentOriginalPos && this.filamentPhases) {
      const posAttr = this.filamentGeo.attributes.position;
      const positions = posAttr.array as Float32Array;
      const twistSpeed = elapsedTime * 0.8 * speedMult;

      for (let i = 0; i < this.filamentCount; i++) {
        const phi = this.filamentPhases[i] + twistSpeed;
        const ox = this.filamentOriginalPos[i * 3];
        const oz = this.filamentOriginalPos[i * 3 + 2];
        const dist = Math.sqrt(ox * ox + oz * oz);

        const currentAngle = Math.atan2(oz, ox) + deltaTime * 0.3 * speedMult;
        const r = dist + Math.sin(phi * 2.0) * metrics.treble * 0.45 + bassPulse * 0.35;

        positions[i * 3] = Math.cos(currentAngle) * r;
        positions[i * 3 + 1] = this.filamentOriginalPos[i * 3 + 1] + Math.cos(phi * 3.0) * metrics.mid * 0.4;
        positions[i * 3 + 2] = Math.sin(currentAngle) * r;
      }
      posAttr.needsUpdate = true;
    }

    // 4. Animate Stellar Core
    if (this.coreOuterMesh && this.coreInnerMesh) {
      this.coreOuterMesh.rotation.x = elapsedTime * 0.5;
      this.coreOuterMesh.rotation.y = elapsedTime * 0.8;
      const oScale = 1.0 + bassPulse * 0.45 + metrics.mid * 0.2;
      this.coreOuterMesh.scale.set(oScale, oScale, oScale);

      this.coreInnerMesh.rotation.x = -elapsedTime * 0.9;
      this.coreInnerMesh.rotation.z = elapsedTime * 0.6;
      const iScale = 1.0 + bassPulse * 0.65;
      this.coreInnerMesh.scale.set(iScale, iScale, iScale);
    }
    if (this.coreLight) {
      this.coreLight.intensity = 4.5 + bassPulse * 9.0 + metrics.treble * 3.5;
    }

    // 5. Cinematic Orbital Camera
    if (this.camera) {
      this.camAngle += deltaTime * 0.08 * speedMult;
      const camRadius = 11.0 - bassPulse * 1.5;
      const shakeX = (Math.random() - 0.5) * 0.1 * bassPulse * shakeMult;
      const shakeY = (Math.random() - 0.5) * 0.1 * bassPulse * shakeMult;

      this.camera.position.x = Math.sin(this.camAngle) * camRadius + shakeX;
      this.camera.position.y = 2.8 + Math.cos(elapsedTime * 0.2) * 1.2 + shakeY;
      this.camera.position.z = Math.cos(this.camAngle) * camRadius;
      this.camera.lookAt(0, 0, 0);

      const targetFov = this.baseFov + bassPulse * 6.0;
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 0.25);
      this.camera.updateProjectionMatrix();
    }
  }

  public applyPalette(palette: ColorPalette): void {
    if (this.scene?.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.setHex(palette.bgHex);
    }
    if (this.coreLight) {
      this.coreLight.color.setHex(palette.accentHex);
    }
    if (this.coreOuterMesh) {
      const mat = this.coreOuterMesh.material as THREE.MeshStandardMaterial;
      mat.color.setHex(palette.primaryHex);
      mat.emissive.setHex(palette.primaryHex);
    }
    if (this.coreInnerMesh) {
      const mat = this.coreInnerMesh.material as THREE.MeshStandardMaterial;
      mat.color.setHex(palette.secondaryHex);
      mat.emissive.setHex(palette.secondaryHex);
    }
  }

  public resize(width: number, height: number): void {
    if (this.camera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  }

  public dispose(): void {
    if (this.scene) {
      if (this.diskMesh) this.scene.remove(this.diskMesh);
      if (this.filamentMesh) this.scene.remove(this.filamentMesh);
      if (this.haloMesh) this.scene.remove(this.haloMesh);
      if (this.coreOuterMesh) this.scene.remove(this.coreOuterMesh);
      if (this.coreInnerMesh) this.scene.remove(this.coreInnerMesh);
      if (this.coreLight) this.scene.remove(this.coreLight);
      if (this.ambientLight) this.scene.remove(this.ambientLight);
    }

    this.diskGeo?.dispose();
    this.filamentGeo?.dispose();
    this.haloGeo?.dispose();

    if (this.diskMesh) (this.diskMesh.material as THREE.Material).dispose();
    if (this.filamentMesh) (this.filamentMesh.material as THREE.Material).dispose();
    if (this.haloMesh) (this.haloMesh.material as THREE.Material).dispose();

    if (this.coreOuterMesh) {
      (this.coreOuterMesh.geometry as THREE.BufferGeometry).dispose();
      (this.coreOuterMesh.material as THREE.Material).dispose();
    }
    if (this.coreInnerMesh) {
      (this.coreInnerMesh.geometry as THREE.BufferGeometry).dispose();
      (this.coreInnerMesh.material as THREE.Material).dispose();
    }

    this.diskOriginalPos = null;
    this.diskRadii = null;
    this.diskThetas = null;
    this.diskSpeeds = null;
    this.filamentOriginalPos = null;
    this.filamentPhases = null;
  }
}
