import * as THREE from 'three';
import { VisualizerScene } from './SceneBase';
import { AudioMetrics } from '../../audio/types';
import { ColorPalette } from '../presets';
import { useVisualizerStore } from '../../store/visualizerStore';

const LATTICE_SIZE = 5; // 5x5x5 grid = 125 crystals
const CRYSTAL_SPACING = 2.8;

export class CrystalLatticeScene implements VisualizerScene {
  public id = 'crystal-lattice';
  public name = '04 // CRYSTAL LATTICE';

  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private readonly baseFov = 60;

  // Crystal grid
  private latticeGroup = new THREE.Group();
  private crystalMeshes: THREE.Mesh[] = [];
  private crystalMaterials: THREE.MeshPhongMaterial[] = [];
  private crystalBaseScales: Float32Array = new Float32Array(0);

  // Inner glow spheres
  private glowMeshes: THREE.Mesh[] = [];

  // Lights
  private pointLight1: THREE.PointLight | null = null;
  private pointLight2: THREE.PointLight | null = null;
  private pointLight3: THREE.PointLight | null = null;
  private ambientLight: THREE.AmbientLight | null = null;

  // Floating energy lines (frequency ribbons)
  private ribbonLines: THREE.Line[] = [];
  private ribbonGeometries: THREE.BufferGeometry[] = [];

  public init(scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
    this.scene = scene;
    this.camera = camera;

    this.camera.position.set(0, 0, 22);
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();

    scene.fog = new THREE.FogExp2(0x030208, 0.032);

    // Lighting
    this.ambientLight = new THREE.AmbientLight(0x111133, 1.0);
    scene.add(this.ambientLight);

    this.pointLight1 = new THREE.PointLight(0x00f0ff, 6.0, 60);
    this.pointLight1.position.set(0, 0, 10);
    scene.add(this.pointLight1);

    this.pointLight2 = new THREE.PointLight(0xff007f, 4.0, 50);
    this.pointLight2.position.set(-12, 8, 0);
    scene.add(this.pointLight2);

    this.pointLight3 = new THREE.PointLight(0xffb700, 3.0, 45);
    this.pointLight3.position.set(12, -8, 0);
    scene.add(this.pointLight3);

    this.setupCrystals();
    scene.add(this.latticeGroup);

    this.setupFrequencyRibbons();
  }

  private setupCrystals(): void {
    const totalCrystals = LATTICE_SIZE * LATTICE_SIZE * LATTICE_SIZE;
    this.crystalBaseScales = new Float32Array(totalCrystals);

    // Elongated octahedron-like crystal geometry
    const geo = new THREE.OctahedronGeometry(0.55, 0);

    // Stretch Y to make it look like a crystal shard
    const pos = geo.attributes.position;
    for (let v = 0; v < pos.count; v++) {
      const y = pos.getY(v);
      pos.setY(v, y * 2.2);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    const glowGeo = new THREE.SphereGeometry(0.18, 8, 8);

    let idx = 0;
    const offset = ((LATTICE_SIZE - 1) * CRYSTAL_SPACING) / 2;

    for (let x = 0; x < LATTICE_SIZE; x++) {
      for (let y = 0; y < LATTICE_SIZE; y++) {
        for (let z = 0; z < LATTICE_SIZE; z++) {
          // Frequency band assignment: outer rings = bass, mid rings = mid, center = treble
          const dx = x - (LATTICE_SIZE - 1) / 2;
          const dy = y - (LATTICE_SIZE - 1) / 2;
          const dz = z - (LATTICE_SIZE - 1) / 2;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          let colorHex: number;
          let emissiveHex: number;
          if (dist < 1.5) {
            colorHex = 0xffb700; // center: accent
            emissiveHex = 0xcc8800;
          } else if (dist < 2.8) {
            colorHex = 0x00f0ff; // mid ring: primary
            emissiveHex = 0x009999;
          } else {
            colorHex = 0xff007f; // outer: secondary
            emissiveHex = 0x990044;
          }

          const mat = new THREE.MeshPhongMaterial({
            color: colorHex,
            emissive: emissiveHex,
            emissiveIntensity: 0.6,
            shininess: 120,
            transparent: true,
            opacity: 0.82,
          });

          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(
            x * CRYSTAL_SPACING - offset,
            y * CRYSTAL_SPACING - offset,
            z * CRYSTAL_SPACING - offset
          );
          // Random initial rotation for variety
          mesh.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          );

          const baseScale = 0.55 + Math.random() * 0.45;
          this.crystalBaseScales[idx] = baseScale;
          mesh.scale.setScalar(baseScale);

          this.crystalMeshes.push(mesh);
          this.crystalMaterials.push(mat);
          this.latticeGroup.add(mesh);

          // Inner glow sphere
          const glowMat = new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.35,
          });
          const glowMesh = new THREE.Mesh(glowGeo, glowMat);
          glowMesh.position.copy(mesh.position);
          this.glowMeshes.push(glowMesh);
          this.latticeGroup.add(glowMesh);

          idx++;
        }
      }
    }
  }

  private setupFrequencyRibbons(): void {
    if (!this.scene) return;
    // 3 diagonal energy lines cutting through the lattice
    const ribbonConfigs = [
      { from: new THREE.Vector3(-15, 0, 0), to: new THREE.Vector3(15, 0, 0), color: 0x00f0ff },
      { from: new THREE.Vector3(0, -15, 0), to: new THREE.Vector3(0, 15, 0), color: 0xff007f },
      { from: new THREE.Vector3(0, 0, -15), to: new THREE.Vector3(0, 0, 15), color: 0xffb700 },
    ];

    for (const cfg of ribbonConfigs) {
      const points = [cfg.from, cfg.to];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.5,
        linewidth: 2,
      });
      const line = new THREE.Line(geo, mat);
      this.ribbonLines.push(line);
      this.ribbonGeometries.push(geo);
      this.scene.add(line);
    }
  }

  public update(elapsedTime: number, deltaTime: number, metrics: AudioMetrics): void {
    if (!this.camera) return;

    const pulse = metrics.beatPulse ?? 0;
    const isPlaying = metrics.isPlaying ?? (metrics.overall > 0.02);
    const { cameraShake, cameraShakeIntensity } = useVisualizerStore.getState();
    const shakeMult = cameraShake ? cameraShakeIntensity : 0.0;

    // 1. Lattice group rotation — slower when not playing
    const baseRotSpeed = isPlaying ? 0.08 + metrics.overall * 0.18 : 0.04;
    this.latticeGroup.rotation.y += baseRotSpeed * deltaTime;
    this.latticeGroup.rotation.x = Math.sin(elapsedTime * 0.22) * 0.18;
    this.latticeGroup.rotation.z = Math.cos(elapsedTime * 0.17) * 0.12;

    // Per-crystal reactivity
    let idx = 0;

    for (let x = 0; x < LATTICE_SIZE; x++) {
      for (let y = 0; y < LATTICE_SIZE; y++) {
        for (let z = 0; z < LATTICE_SIZE; z++) {
          if (idx >= this.crystalMeshes.length) break;

          const mesh = this.crystalMeshes[idx];
          const mat = this.crystalMaterials[idx];
          const glowMesh = this.glowMeshes[idx];
          const baseScale = this.crystalBaseScales[idx];

          const dx = x - (LATTICE_SIZE - 1) / 2;
          const dy = y - (LATTICE_SIZE - 1) / 2;
          const dz = z - (LATTICE_SIZE - 1) / 2;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          // Pick frequency band by distance layer
          let bandEnergy: number;
          if (dist < 1.5) {
            bandEnergy = metrics.treble;
          } else if (dist < 2.8) {
            bandEnergy = metrics.mid;
          } else {
            bandEnergy = metrics.bass;
          }

          // Ripple wave through lattice based on position and time
          const ripple = Math.sin(elapsedTime * 4.5 - dist * 0.85 + pulse * 8.0) * 0.5 + 0.5;

          // Beat shatter: massive scale burst on kick drums
          const beatBurst = pulse * 0.6;
          const targetScale = baseScale * (1.0 + bandEnergy * 0.9 + ripple * bandEnergy * 0.4 + beatBurst);
          const currentScale = mesh.scale.x;
          mesh.scale.setScalar(currentScale + (targetScale - currentScale) * 0.35);

          // Crystal rotation accelerates with audio
          const rotSpeed = (0.3 + bandEnergy * 1.2 + pulse * 2.0) * deltaTime;
          mesh.rotation.y += rotSpeed * (idx % 2 === 0 ? 1 : -1);
          mesh.rotation.x += rotSpeed * 0.7;

          // Emissive glow driven by band energy + beat
          mat.emissiveIntensity = 0.4 + bandEnergy * 2.2 + pulse * 3.0 + ripple * bandEnergy;
          mat.opacity = 0.65 + bandEnergy * 0.3 + pulse * 0.1;

          // Inner glow sphere size
          const glowScale = 0.6 + bandEnergy * 2.5 + pulse * 2.0;
          glowMesh.scale.setScalar(glowScale);
          (glowMesh.material as THREE.MeshBasicMaterial).opacity = 0.15 + bandEnergy * 0.4 + pulse * 0.25;

          idx++;
        }
      }
    }

    // 3. Energy ribbon pulses
    const ribbonMetrics = [metrics.bass, metrics.mid, metrics.treble];
    for (let i = 0; i < this.ribbonLines.length; i++) {
      const mat = this.ribbonLines[i].material as THREE.LineBasicMaterial;
      mat.opacity = 0.2 + ribbonMetrics[i] * 0.75 + pulse * 0.3;
    }

    // 4. Reactive lights
    if (this.pointLight1) {
      this.pointLight1.intensity = 5.0 + metrics.treble * 12 + pulse * 16;
      this.pointLight1.position.set(
        Math.sin(elapsedTime * 0.7) * 10,
        Math.cos(elapsedTime * 0.5) * 8,
        10 + metrics.bass * 5
      );
    }
    if (this.pointLight2) {
      this.pointLight2.intensity = 4.0 + metrics.bass * 10 + pulse * 12;
    }
    if (this.pointLight3) {
      this.pointLight3.intensity = 3.0 + metrics.mid * 8 + pulse * 8;
    }

    // 5. Camera orbit + shake + FOV
    this.camera.position.x = Math.sin(elapsedTime * 0.15) * 4 + metrics.rawBass * 0.6 * Math.sin(elapsedTime * 3) * shakeMult;
    this.camera.position.y = Math.cos(elapsedTime * 0.12) * 3;
    this.camera.lookAt(0, 0, 0);

    const targetFov = this.baseFov + metrics.bass * 7 + pulse * 9;
    this.camera.fov += (targetFov - this.camera.fov) * 0.4;
    this.camera.updateProjectionMatrix();
  }

  public applyPalette(palette: ColorPalette): void {
    if (this.scene?.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.setHex(palette.bgHex);
    }
    if (this.pointLight1) this.pointLight1.color.setHex(palette.primaryHex);
    if (this.pointLight2) this.pointLight2.color.setHex(palette.secondaryHex);
    if (this.pointLight3) this.pointLight3.color.setHex(palette.accentHex);

    let idx = 0;
    for (let x = 0; x < LATTICE_SIZE; x++) {
      for (let y = 0; y < LATTICE_SIZE; y++) {
        for (let z = 0; z < LATTICE_SIZE; z++) {
          if (idx >= this.crystalMaterials.length) break;
          const dx = x - (LATTICE_SIZE - 1) / 2;
          const dy = y - (LATTICE_SIZE - 1) / 2;
          const dz = z - (LATTICE_SIZE - 1) / 2;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          let colorHex: number;
          if (dist < 1.5) {
            colorHex = palette.accentHex;
          } else if (dist < 2.8) {
            colorHex = palette.primaryHex;
          } else {
            colorHex = palette.secondaryHex;
          }

          this.crystalMaterials[idx].color.setHex(colorHex);
          this.crystalMaterials[idx].emissive.setHex(colorHex);
          (this.glowMeshes[idx].material as THREE.MeshBasicMaterial).color.setHex(colorHex);
          idx++;
        }
      }
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
      this.scene.remove(this.latticeGroup);
      if (this.ambientLight) this.scene.remove(this.ambientLight);
      if (this.pointLight1) this.scene.remove(this.pointLight1);
      if (this.pointLight2) this.scene.remove(this.pointLight2);
      if (this.pointLight3) this.scene.remove(this.pointLight3);
      for (const line of this.ribbonLines) {
        this.scene.remove(line);
      }
    }

    for (const mat of this.crystalMaterials) mat.dispose();
    for (const mesh of this.glowMeshes) {
      (mesh.material as THREE.Material).dispose();
    }
    for (const geo of this.ribbonGeometries) geo.dispose();

    this.crystalMeshes = [];
    this.crystalMaterials = [];
    this.glowMeshes = [];
    this.ribbonLines = [];
    this.ribbonGeometries = [];
  }
}
