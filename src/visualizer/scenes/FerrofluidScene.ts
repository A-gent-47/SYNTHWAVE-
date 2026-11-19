import * as THREE from 'three';
import { VisualizerScene } from './SceneBase';
import { AudioMetrics } from '../../audio/types';
import { ColorPalette } from '../presets';
import { useVisualizerStore } from '../../store/visualizerStore';

export class FerrofluidScene implements VisualizerScene {
  public id = 'ferrofluid';
  public name = '04 // FERROFLUID SINGULARITY';

  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;

  // Sculptural Metallic Ferrofluid Core
  private coreMesh: THREE.Mesh | null = null;
  private wireframeMesh: THREE.Mesh | null = null;
  private coreGeo: THREE.IcosahedronGeometry | null = null;
  private coreMat: THREE.MeshStandardMaterial | null = null;
  private wireMat: THREE.MeshBasicMaterial | null = null;
  private originalPositions: Float32Array | null = null;
  private originalNormals: Float32Array | null = null;

  // Outer Equatorial Spectrum Halo (64 Instanced Radial Bars)
  private readonly haloCount = 64;
  private haloMesh: THREE.InstancedMesh | null = null;
  private haloGeo: THREE.CylinderGeometry | null = null;
  private haloMat: THREE.MeshStandardMaterial | null = null;

  // Outer Waveform Ribbon (128-point closed LineLoop tilted at 35 deg)
  private readonly ribbonPoints = 128;
  private ribbonLoop: THREE.LineLoop | null = null;
  private ribbonGeo: THREE.BufferGeometry | null = null;
  private ribbonPositions: Float32Array | null = null;
  private ribbonGroup: THREE.Group = new THREE.Group();

  // Reusable scratch objects (ZERO per-frame heap allocations)
  private readonly dummyMatrix = new THREE.Matrix4();
  private readonly dummyPosition = new THREE.Vector3();
  private readonly dummyScale = new THREE.Vector3();
  private readonly dummyQuaternion = new THREE.Quaternion();
  private readonly dummyColor = new THREE.Color();

  // Lighting
  private keyLight: THREE.PointLight | null = null;
  private rimLight: THREE.PointLight | null = null;
  private ambientLight: THREE.AmbientLight | null = null;

  // Camera & Motion
  private readonly baseFov = 60;
  private camAngle = 0;

  public init(scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
    this.scene = scene;
    this.camera = camera;

    this.camera.position.set(0, 3.0, 9.5);
    this.camera.lookAt(0, 0, 0);
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();

    // Dark metallic atmospheric fog
    scene.fog = new THREE.FogExp2(0x050409, 0.02);

    // Setup Lighting
    this.ambientLight = new THREE.AmbientLight(0x0c0914, 1.4);
    scene.add(this.ambientLight);

    this.keyLight = new THREE.PointLight(0x00f0ff, 5.0, 35);
    this.keyLight.position.set(6, 8, 8);
    scene.add(this.keyLight);

    this.rimLight = new THREE.PointLight(0xff007f, 4.5, 30);
    this.rimLight.position.set(-7, -4, -6);
    scene.add(this.rimLight);

    // Build Scene Components
    this.setupCore();
    this.setupSpectrumHalo();
    this.setupWaveformRibbon();
  }

  private setupCore(): void {
    if (!this.scene) return;

    const store = useVisualizerStore.getState();
    const detail = store.reducedEffects ? 4 : 5;
    this.coreGeo = new THREE.IcosahedronGeometry(3.0, detail);

    const pos = this.coreGeo.attributes.position;
    this.originalPositions = new Float32Array(pos.array);
    this.coreGeo.computeVertexNormals();
    this.originalNormals = new Float32Array(this.coreGeo.attributes.normal.array);

    // Liquid chrome / obsidian metallic material
    this.coreMat = new THREE.MeshStandardMaterial({
      color: 0x12101a,
      roughness: 0.16,
      metalness: 0.88,
      emissive: 0x002233,
      emissiveIntensity: 0.25
    });

    this.coreMesh = new THREE.Mesh(this.coreGeo, this.coreMat);
    this.scene.add(this.coreMesh);

    // Subtle luminous wireframe overlay
    this.wireMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.18
    });

    this.wireframeMesh = new THREE.Mesh(this.coreGeo, this.wireMat);
    this.scene.add(this.wireframeMesh);
  }

  private setupSpectrumHalo(): void {
    if (!this.scene) return;

    // Instanced radial spectrum bars orbiting in equatorial plane
    this.haloGeo = new THREE.CylinderGeometry(0.04, 0.08, 1.0, 6);
    this.haloGeo.rotateX(Math.PI / 2); // point radially outward

    this.haloMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00a0cc,
      emissiveIntensity: 1.2,
      roughness: 0.2,
      metalness: 0.8
    });

    this.haloMesh = new THREE.InstancedMesh(this.haloGeo, this.haloMat, this.haloCount);

    const radius = 4.8;
    for (let i = 0; i < this.haloCount; i++) {
      const angle = (i / this.haloCount) * Math.PI * 2;
      this.dummyPosition.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      this.dummyQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -angle);
      this.dummyScale.set(1, 1, 1);
      this.dummyMatrix.compose(this.dummyPosition, this.dummyQuaternion, this.dummyScale);
      this.haloMesh.setMatrixAt(i, this.dummyMatrix);

      const t = i / this.haloCount;
      this.dummyColor.setHSL(0.5 + t * 0.35, 1.0, 0.55);
      this.haloMesh.setColorAt(i, this.dummyColor);
    }

    this.haloMesh.instanceMatrix.needsUpdate = true;
    if (this.haloMesh.instanceColor) this.haloMesh.instanceColor.needsUpdate = true;
    this.scene.add(this.haloMesh);
  }

  private setupWaveformRibbon(): void {
    if (!this.scene) return;

    this.ribbonPositions = new Float32Array(this.ribbonPoints * 3);
    const radius = 4.3;

    for (let i = 0; i < this.ribbonPoints; i++) {
      const angle = (i / this.ribbonPoints) * Math.PI * 2;
      this.ribbonPositions[i * 3] = Math.cos(angle) * radius;
      this.ribbonPositions[i * 3 + 1] = 0;
      this.ribbonPositions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    this.ribbonGeo = new THREE.BufferGeometry();
    this.ribbonGeo.setAttribute('position', new THREE.BufferAttribute(this.ribbonPositions, 3));

    const ribbonMat = new THREE.LineBasicMaterial({
      color: 0xff007f,
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });

    this.ribbonLoop = new THREE.LineLoop(this.ribbonGeo, ribbonMat);
    this.ribbonGroup = new THREE.Group();
    // Tilt at 35 degrees as specified
    this.ribbonGroup.rotation.x = (35 * Math.PI) / 180;
    this.ribbonGroup.add(this.ribbonLoop);
    this.scene.add(this.ribbonGroup);
  }

  public update(elapsedTime: number, deltaTime: number, metrics: AudioMetrics): void {
    const store = useVisualizerStore.getState();
    const isPlaying = metrics.overall > 0.01;
    const speedMult = store.motionSpeed * (isPlaying ? 1.0 + metrics.mid * 0.6 : 0.25);
    const beatPulse = (typeof metrics.beatPulse === 'number') ? metrics.beatPulse : 0;
    const bassPulse = beatPulse * store.bassSensitivity;
    const shakeMult = store.cameraShake ? store.cameraShakeIntensity : 0.0;

    // 1. Multi-Harmonic Ferrofluid Vertex Displacement
    if (this.coreGeo && this.originalPositions && this.originalNormals) {
      const posAttr = this.coreGeo.attributes.position;
      const pos = posAttr.array as Float32Array;
      const count = posAttr.count;

      const bassWeight = (0.28 + metrics.bass * 0.95 + bassPulse * 0.65) * store.bassSensitivity;
      const midWeight = (0.15 + metrics.mid * 0.65) * store.midSensitivity;
      const trebleWeight = (0.08 + metrics.treble * 0.45) * store.trebleSensitivity;

      for (let i = 0; i < count; i++) {
        const ox = this.originalPositions[i * 3];
        const oy = this.originalPositions[i * 3 + 1];
        const oz = this.originalPositions[i * 3 + 2];

        const nx = this.originalNormals[i * 3];
        const ny = this.originalNormals[i * 3 + 1];
        const nz = this.originalNormals[i * 3 + 2];

        // Low-frequency magnetic spike lobes (spherical harmonics)
        const harm1 = Math.sin(ox * 1.5 + elapsedTime * 2.5) *
                      Math.cos(oy * 1.5 + elapsedTime * 1.8) *
                      Math.sin(oz * 1.5 + elapsedTime * 2.2);

        // Mid-frequency fluid surface ripples
        const harm2 = Math.sin(ox * 3.8 - elapsedTime * 4.2) *
                      Math.cos(oz * 3.8 + elapsedTime * 3.6);

        // High-frequency magnetic crest tension
        const harm3 = Math.sin((ox + oy + oz) * 6.5 + elapsedTime * 6.0);

        const displacement = harm1 * bassWeight + harm2 * midWeight + harm3 * trebleWeight;

        pos[i * 3] = ox + nx * displacement;
        pos[i * 3 + 1] = oy + ny * displacement;
        pos[i * 3 + 2] = oz + nz * displacement;
      }

      posAttr.needsUpdate = true;
      // Recompute normals for realistic metallic specular reflections
      this.coreGeo.computeVertexNormals();
    }

    // 2. Animate Equatorial Spectrum Halo Bars
    if (this.haloMesh) {
      const orbitAngle = elapsedTime * 0.4 * speedMult;
      const baseRadius = 4.8 + bassPulse * 0.4;
      const freqData = metrics.frequencyData;

      for (let i = 0; i < this.haloCount; i++) {
        const angle = (i / this.haloCount) * Math.PI * 2 + orbitAngle;
        const binIdx = Math.floor((i / this.haloCount) * Math.min(180, freqData.length));
        const binVal = freqData[binIdx] ? freqData[binIdx] / 255 : (Math.sin(i * 0.3 + elapsedTime * 3.0) * 0.3 + 0.3);

        const barScaleZ = 0.5 + binVal * 2.8 * store.midSensitivity;
        const barDist = baseRadius + barScaleZ * 0.5;

        this.dummyPosition.set(Math.cos(angle) * barDist, 0, Math.sin(angle) * barDist);
        this.dummyQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -angle);
        this.dummyScale.set(1.0 + binVal * 0.8, 1.0 + binVal * 0.8, barScaleZ);
        this.dummyMatrix.compose(this.dummyPosition, this.dummyQuaternion, this.dummyScale);
        this.haloMesh.setMatrixAt(i, this.dummyMatrix);
      }
      this.haloMesh.instanceMatrix.needsUpdate = true;
    }

    // 3. Animate 35-Degree Waveform Ribbon
    if (this.ribbonGeo && this.ribbonPositions) {
      const posAttr = this.ribbonGeo.attributes.position;
      const positions = posAttr.array as Float32Array;
      const wave = metrics.waveform;
      const radius = 4.3 + bassPulse * 0.3;

      for (let i = 0; i < this.ribbonPoints; i++) {
        const angle = (i / this.ribbonPoints) * Math.PI * 2;
        const waveVal = wave[i * 2] !== undefined ? ((wave[i * 2] - 128) / 128) : 0;
        const yDisp = waveVal * 1.2 * store.midSensitivity;

        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = yDisp;
        positions[i * 3 + 2] = Math.sin(angle) * radius;
      }
      posAttr.needsUpdate = true;

      // Slow orbital precession of ribbon group
      this.ribbonGroup.rotation.y = elapsedTime * 0.25 * speedMult;
    }

    // 4. Lights & Material Specular Modulation
    if (this.keyLight && this.rimLight) {
      this.keyLight.intensity = 4.0 + bassPulse * 6.0 + metrics.bass * 3.0;
      this.rimLight.intensity = 3.5 + metrics.treble * 5.0;
    }
    if (this.coreMat) {
      this.coreMat.emissiveIntensity = 0.2 + bassPulse * 0.7;
    }

    // 5. Smooth Camera Orbital Glide with Bass Breathing
    if (this.camera) {
      this.camAngle += deltaTime * 0.12 * speedMult;
      const camRadius = 9.5 - bassPulse * 1.2;
      const shakeX = (Math.random() - 0.5) * 0.08 * bassPulse * shakeMult;
      const shakeY = (Math.random() - 0.5) * 0.08 * bassPulse * shakeMult;

      this.camera.position.x = Math.sin(this.camAngle) * camRadius + shakeX;
      this.camera.position.y = 2.4 + Math.sin(elapsedTime * 0.3) * 1.2 + shakeY;
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
    if (this.keyLight) this.keyLight.color.setHex(palette.primaryHex);
    if (this.rimLight) this.rimLight.color.setHex(palette.secondaryHex);
    if (this.wireMat) this.wireMat.color.setHex(palette.primaryHex);
    if (this.haloMat) {
      this.haloMat.color.setHex(palette.primaryHex);
      this.haloMat.emissive.setHex(palette.primaryHex);
    }
    if (this.ribbonLoop) {
      (this.ribbonLoop.material as THREE.LineBasicMaterial).color.setHex(palette.secondaryHex);
    }
    if (this.coreMat) {
      this.coreMat.emissive.setHex(palette.accentHex);
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
      if (this.coreMesh) this.scene.remove(this.coreMesh);
      if (this.wireframeMesh) this.scene.remove(this.wireframeMesh);
      if (this.haloMesh) this.scene.remove(this.haloMesh);
      if (this.ribbonGroup) this.scene.remove(this.ribbonGroup);
      if (this.keyLight) this.scene.remove(this.keyLight);
      if (this.rimLight) this.scene.remove(this.rimLight);
      if (this.ambientLight) this.scene.remove(this.ambientLight);
    }

    this.coreGeo?.dispose();
    this.haloGeo?.dispose();
    this.ribbonGeo?.dispose();

    this.coreMat?.dispose();
    this.wireMat?.dispose();
    this.haloMat?.dispose();
    if (this.ribbonLoop) (this.ribbonLoop.material as THREE.Material).dispose();

    this.originalPositions = null;
    this.originalNormals = null;
    this.ribbonPositions = null;
  }
}
