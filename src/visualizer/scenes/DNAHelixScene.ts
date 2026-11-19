import * as THREE from 'three';
import { VisualizerScene } from './SceneBase';
import { AudioMetrics } from '../../audio/types';
import { ColorPalette } from '../presets';
import { useVisualizerStore } from '../../store/visualizerStore';

const HELIX_SEGMENTS = 80;         // nucleotides per strand
const HELIX_RADIUS = 3.2;          // radius of each strand's orbit
const HELIX_PITCH = 0.55;          // vertical pitch per segment
const PARTICLE_COUNT = 2400;       // floating particles

export class DNAHelixScene implements VisualizerScene {
  public id = 'dna-helix';
  public name = '06 // DNA HELIX';

  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private readonly baseFov = 65;

  // DNA Structure
  private helixGroup = new THREE.Group();

  // Two strand backbones
  private strand1Meshes: THREE.Mesh[] = [];
  private strand2Meshes: THREE.Mesh[] = [];
  private strand1Materials: THREE.MeshStandardMaterial[] = [];
  private strand2Materials: THREE.MeshStandardMaterial[] = [];

  // Cross-bridges (base pairs) — cylinders connecting strands
  private bridgeMeshes: THREE.Mesh[] = [];
  private bridgeMaterials: THREE.MeshStandardMaterial[] = [];

  // Floating particles
  private particlesMesh: THREE.Points | null = null;
  private particlePositions: Float32Array | null = null;
  private particleVelocities: Float32Array | null = null;

  // Lights
  private ambientLight: THREE.AmbientLight | null = null;
  private helixLight1: THREE.PointLight | null = null;
  private helixLight2: THREE.PointLight | null = null;

  public init(scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
    this.scene = scene;
    this.camera = camera;
    this.camera.position.set(0, 0, 28);
    this.camera.fov = this.baseFov;
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();

    scene.fog = new THREE.FogExp2(0x02010a, 0.026);

    this.ambientLight = new THREE.AmbientLight(0x0a0520, 1.2);
    scene.add(this.ambientLight);

    this.helixLight1 = new THREE.PointLight(0x00f0ff, 6.0, 60);
    this.helixLight1.position.set(-8, 5, 10);
    scene.add(this.helixLight1);

    this.helixLight2 = new THREE.PointLight(0xff007f, 5.0, 55);
    this.helixLight2.position.set(8, -5, 10);
    scene.add(this.helixLight2);

    this.buildHelix();
    scene.add(this.helixGroup);
    this.buildParticles();
  }

  private buildHelix(): void {
    const nucleotideGeo = new THREE.SphereGeometry(0.28, 10, 10);
    const bridgeGeo = new THREE.CylinderGeometry(0.07, 0.07, 1, 8);

    const totalHeight = HELIX_SEGMENTS * HELIX_PITCH;
    const startY = -totalHeight / 2;

    for (let i = 0; i < HELIX_SEGMENTS; i++) {
      const t = (i / HELIX_SEGMENTS) * Math.PI * 2 * 6; // 6 full turns
      const y = startY + i * HELIX_PITCH;

      // Strand 1 nucleotide (sphere on the helix)
      const x1 = Math.cos(t) * HELIX_RADIUS;
      const z1 = Math.sin(t) * HELIX_RADIUS;

      // Strand 2 nucleotide (opposite side)
      const x2 = Math.cos(t + Math.PI) * HELIX_RADIUS;
      const z2 = Math.sin(t + Math.PI) * HELIX_RADIUS;

      // Gradient color along the strand — frequency band assignment by position
      const fraction = i / HELIX_SEGMENTS;
      const emissive1Color = new THREE.Color().setHSL(0.55 - fraction * 0.15, 1.0, 0.5);
      const emissive2Color = new THREE.Color().setHSL(0.95 + fraction * 0.1, 1.0, 0.5);

      const mat1 = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: emissive1Color,
        emissiveIntensity: 0.8,
        roughness: 0.3,
        metalness: 0.7,
      });
      const mesh1 = new THREE.Mesh(nucleotideGeo, mat1);
      mesh1.position.set(x1, y, z1);
      this.strand1Meshes.push(mesh1);
      this.strand1Materials.push(mat1);
      this.helixGroup.add(mesh1);

      const mat2 = new THREE.MeshStandardMaterial({
        color: 0xff007f,
        emissive: emissive2Color,
        emissiveIntensity: 0.8,
        roughness: 0.3,
        metalness: 0.7,
      });
      const mesh2 = new THREE.Mesh(nucleotideGeo, mat2);
      mesh2.position.set(x2, y, z2);
      this.strand2Meshes.push(mesh2);
      this.strand2Materials.push(mat2);
      this.helixGroup.add(mesh2);

      // Cross-bridge (base pair) every 3rd segment
      if (i % 3 === 0) {
        const midX = (x1 + x2) / 2;
        const midZ = (z1 + z2) / 2;
        const dx = x2 - x1;
        const dz = z2 - z1;
        const length = Math.sqrt(dx * dx + dz * dz);

        const bridgeMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0x8800ff,
          emissiveIntensity: 0.5,
          roughness: 0.4,
          metalness: 0.6,
          transparent: true,
          opacity: 0.75,
        });

        const bridgeMesh = new THREE.Mesh(bridgeGeo, bridgeMat);
        bridgeMesh.position.set(midX, y, midZ);
        bridgeMesh.scale.set(1, length, 1);

        // Orient bridge horizontally from strand1 to strand2
        const angle = Math.atan2(dz, dx);
        bridgeMesh.rotation.z = Math.PI / 2;
        bridgeMesh.rotation.y = -angle;

        this.bridgeMeshes.push(bridgeMesh);
        this.bridgeMaterials.push(bridgeMat);
        this.helixGroup.add(bridgeMesh);
      }
    }
  }

  private buildParticles(): void {
    if (!this.scene) return;

    this.particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    this.particleVelocities = new Float32Array(PARTICLE_COUNT * 3);

    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const cyan = new THREE.Color(0x00f0ff);
    const magenta = new THREE.Color(0xff007f);
    const white = new THREE.Color(0xffffff);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 5 + Math.random() * 12;
      this.particlePositions[i * 3] = Math.cos(theta) * r;
      this.particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      this.particlePositions[i * 3 + 2] = Math.sin(theta) * r;

      // Slow drift velocity
      this.particleVelocities[i * 3] = (Math.random() - 0.5) * 0.4;
      this.particleVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      this.particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.4;

      const col = Math.random() > 0.5 ? cyan : Math.random() > 0.5 ? magenta : white;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particlesMesh = new THREE.Points(geo, mat);
    this.scene.add(this.particlesMesh);
  }

  public update(elapsedTime: number, deltaTime: number, metrics: AudioMetrics): void {
    if (!this.camera) return;

    const pulse = metrics.beatPulse ?? 0;
    const isPlaying = metrics.isPlaying ?? (metrics.overall > 0.02);
    const { cameraShake, cameraShakeIntensity } = useVisualizerStore.getState();
    const shakeMult = cameraShake ? cameraShakeIntensity : 0.0;

    // 1. Helix rotation — driven by music
    const rotY = isPlaying
      ? (0.4 + metrics.overall * 1.0 + pulse * 1.5) * deltaTime
      : 0.12 * deltaTime;
    this.helixGroup.rotation.y += rotY;

    // 2. Per-nucleotide reactivity
    for (let i = 0; i < this.strand1Meshes.length; i++) {
      const fraction = i / HELIX_SEGMENTS;

      // Map frequency bands: lower strand = bass, upper = treble
      const freq = fraction < 0.33 ? metrics.bass : fraction < 0.66 ? metrics.mid : metrics.treble;

      // Pulsing size — nucleotide scale beats
      const beatScale = 1.0 + freq * 0.8 + pulse * 1.0;
      const wave = Math.sin(elapsedTime * 5 - fraction * Math.PI * 4) * 0.35 * freq;
      const finalScale = beatScale + wave;

      this.strand1Meshes[i].scale.setScalar(Math.max(0.4, finalScale));
      this.strand2Meshes[i].scale.setScalar(Math.max(0.4, finalScale * 0.92));

      // Emissive brightness
      this.strand1Materials[i].emissiveIntensity = 0.5 + freq * 2.5 + pulse * 3.0;
      this.strand2Materials[i].emissiveIntensity = 0.5 + freq * 2.0 + pulse * 2.5;
    }

    // 3. Bridge pulse
    for (let i = 0; i < this.bridgeMeshes.length; i++) {
      const mat = this.bridgeMaterials[i];
      const frac = i / this.bridgeMeshes.length;
      const freq = frac < 0.5 ? metrics.mid : metrics.treble;
      mat.emissiveIntensity = 0.3 + freq * 2.0 + pulse * 2.5;
      mat.opacity = 0.5 + freq * 0.4 + pulse * 0.15;
    }

    // 4. Floating particles — swirl outward on beats
    if (this.particlesMesh && this.particlePositions && this.particleVelocities) {
      const positions = this.particlesMesh.geometry.attributes.position;
      const burst = pulse * 4.0;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const x = this.particlePositions[i * 3];
        const z = this.particlePositions[i * 3 + 2];
        const r = Math.sqrt(x * x + z * z);

        // Spiral drift + burst expansion
        this.particlePositions[i * 3] += (this.particleVelocities[i * 3] + (x / Math.max(r, 0.1)) * burst * 0.04) * deltaTime;
        this.particlePositions[i * 3 + 1] += this.particleVelocities[i * 3 + 1] * deltaTime;
        this.particlePositions[i * 3 + 2] += (this.particleVelocities[i * 3 + 2] + (z / Math.max(r, 0.1)) * burst * 0.04) * deltaTime;

        // Boundary wrap
        const newR = Math.sqrt(this.particlePositions[i * 3] ** 2 + this.particlePositions[i * 3 + 2] ** 2);
        if (newR > 18 || Math.abs(this.particlePositions[i * 3 + 1]) > 16) {
          const theta = Math.random() * Math.PI * 2;
          const rd = 5 + Math.random() * 6;
          this.particlePositions[i * 3] = Math.cos(theta) * rd;
          this.particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 25;
          this.particlePositions[i * 3 + 2] = Math.sin(theta) * rd;
        }
      }
      (positions as THREE.BufferAttribute).needsUpdate = true;

      const mat = this.particlesMesh.material as THREE.PointsMaterial;
      mat.opacity = 0.4 + metrics.treble * 0.4 + pulse * 0.2;
    }

    // 5. Reactive lights
    if (this.helixLight1) {
      this.helixLight1.intensity = 5 + metrics.treble * 12 + pulse * 16;
      this.helixLight1.position.set(
        Math.sin(elapsedTime * 0.8) * 10,
        Math.cos(elapsedTime * 0.6) * 8,
        10
      );
    }
    if (this.helixLight2) {
      this.helixLight2.intensity = 4 + metrics.bass * 10 + pulse * 14;
      this.helixLight2.position.set(
        Math.cos(elapsedTime * 0.7) * 10,
        Math.sin(elapsedTime * 0.5) * 8,
        8
      );
    }

    // 6. Camera slow orbit + shake + FOV pulse
    this.camera.position.x = Math.sin(elapsedTime * 0.18) * 5 + metrics.rawBass * 0.5 * Math.sin(elapsedTime * 3) * shakeMult;
    this.camera.position.y = Math.cos(elapsedTime * 0.14) * 3;
    this.camera.lookAt(0, 0, 0);

    const targetFov = this.baseFov + metrics.bass * 6 + pulse * 8;
    this.camera.fov += (targetFov - this.camera.fov) * 0.4;
    this.camera.updateProjectionMatrix();
  }

  public applyPalette(palette: ColorPalette): void {
    if (this.scene?.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.setHex(palette.bgHex);
    }
    if (this.helixLight1) this.helixLight1.color.setHex(palette.primaryHex);
    if (this.helixLight2) this.helixLight2.color.setHex(palette.secondaryHex);

    for (const mat of this.strand1Materials) {
      mat.color.setHex(palette.primaryHex);
    }
    for (const mat of this.strand2Materials) {
      mat.color.setHex(palette.secondaryHex);
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
      this.scene.remove(this.helixGroup);
      if (this.particlesMesh) this.scene.remove(this.particlesMesh);
      if (this.ambientLight) this.scene.remove(this.ambientLight);
      if (this.helixLight1) this.scene.remove(this.helixLight1);
      if (this.helixLight2) this.scene.remove(this.helixLight2);
    }

    for (const mat of [...this.strand1Materials, ...this.strand2Materials, ...this.bridgeMaterials]) {
      mat.dispose();
    }
    if (this.particlesMesh) {
      this.particlesMesh.geometry.dispose();
      (this.particlesMesh.material as THREE.Material).dispose();
    }

    this.strand1Meshes = [];
    this.strand2Meshes = [];
    this.strand1Materials = [];
    this.strand2Materials = [];
    this.bridgeMeshes = [];
    this.bridgeMaterials = [];
  }
}
