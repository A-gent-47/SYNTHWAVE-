import * as THREE from 'three';
import { VisualizerScene } from './SceneBase';
import { AudioMetrics } from '../../audio/types';
import { ColorPalette } from '../presets';
import { useVisualizerStore } from '../../store/visualizerStore';

const VORTEX_RINGS = 48;            // spiraling rings forming the vortex funnel
const VORTEX_PARTICLES = 3600;      // plasma particles swept in the vortex
const LIGHTNING_BOLT_COUNT = 8;     // branching arc bolts

export class PlasmaVortexScene implements VisualizerScene {
  public id = 'plasma-vortex';
  public name = '07 // PLASMA VORTEX';

  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private readonly baseFov = 70;

  // Vortex funnel rings (each ring is a torus positioned along the Y axis)
  private vortexGroup = new THREE.Group();
  private ringMeshes: THREE.Mesh[] = [];
  private ringMaterials: THREE.MeshStandardMaterial[] = [];

  // Plasma particle field
  private plasmaParticles: THREE.Points | null = null;
  private plasmaPositions: Float32Array | null = null;
  private plasmaAngles: Float32Array | null = null;
  private plasmaRadii: Float32Array | null = null;
  private plasmaHeights: Float32Array | null = null;
  private plasmaSpeeds: Float32Array | null = null;

  // Core energy sphere
  private coreMesh: THREE.Mesh | null = null;
  private coreGlowMesh: THREE.Mesh | null = null;
  private coreMaterial: THREE.MeshStandardMaterial | null = null;

  // Arc lightning bolts (line segments)
  private lightningLines: THREE.Line[] = [];
  private lightningGeometries: THREE.BufferGeometry[] = [];
  private lightningPoints: Float32Array[] = [];

  // Lights
  private ambientLight: THREE.AmbientLight | null = null;
  private coreLight: THREE.PointLight | null = null;
  private outerLight1: THREE.PointLight | null = null;
  private outerLight2: THREE.PointLight | null = null;

  public init(scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
    this.scene = scene;
    this.camera = camera;
    this.camera.position.set(0, 6, 32);
    this.camera.fov = this.baseFov;
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();

    scene.fog = new THREE.FogExp2(0x030108, 0.025);

    // Lights
    this.ambientLight = new THREE.AmbientLight(0x110022, 1.0);
    scene.add(this.ambientLight);

    this.coreLight = new THREE.PointLight(0xffffff, 8.0, 50);
    this.coreLight.position.set(0, 0, 0);
    scene.add(this.coreLight);

    this.outerLight1 = new THREE.PointLight(0x00f0ff, 5.0, 60);
    this.outerLight1.position.set(-10, 10, 0);
    scene.add(this.outerLight1);

    this.outerLight2 = new THREE.PointLight(0xff007f, 4.5, 55);
    this.outerLight2.position.set(10, -8, 0);
    scene.add(this.outerLight2);

    this.buildVortexRings();
    scene.add(this.vortexGroup);

    this.buildPlasmaParticles();
    this.buildCore();
    this.buildLightning();
  }

  private buildVortexRings(): void {
    const totalHeight = 24;
    const startY = -totalHeight / 2;

    for (let i = 0; i < VORTEX_RINGS; i++) {
      const frac = i / VORTEX_RINGS;

      // Funnel shape: wide at top, narrow at center, wide at bottom (hourglass)
      const distFromCenter = Math.abs(frac - 0.5) * 2.0; // 0 at center, 1 at edges
      const radius = 0.8 + distFromCenter * 7.0;

      const y = startY + frac * totalHeight;

      // Gradient through the vortex — cyan at edges, magenta/white at core
      const hue = 0.52 - distFromCenter * 0.2;
      const emissiveColor = new THREE.Color().setHSL(hue, 1.0, 0.6);

      const mat = new THREE.MeshStandardMaterial({
        color: emissiveColor,
        emissive: emissiveColor,
        emissiveIntensity: 0.8 + (1 - distFromCenter) * 0.5,
        roughness: 0.2,
        metalness: 0.5,
        transparent: true,
        opacity: 0.55 + (1 - distFromCenter) * 0.3,
        wireframe: frac > 0.35 && frac < 0.65 ? false : true, // solid in the waist
      });

      // Very thin torus ring
      const geo = new THREE.TorusGeometry(radius, 0.06 + (1 - distFromCenter) * 0.08, 8, 32);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, y, 0);
      mesh.rotation.set(Math.PI / 2, 0, (i / VORTEX_RINGS) * Math.PI * 4); // spiral twist

      this.ringMeshes.push(mesh);
      this.ringMaterials.push(mat);
      this.vortexGroup.add(mesh);
    }
  }

  private buildPlasmaParticles(): void {
    if (!this.scene) return;

    this.plasmaPositions = new Float32Array(VORTEX_PARTICLES * 3);
    this.plasmaAngles = new Float32Array(VORTEX_PARTICLES);
    this.plasmaRadii = new Float32Array(VORTEX_PARTICLES);
    this.plasmaHeights = new Float32Array(VORTEX_PARTICLES);
    this.plasmaSpeeds = new Float32Array(VORTEX_PARTICLES);

    const colors = new Float32Array(VORTEX_PARTICLES * 3);
    const cyan = new THREE.Color(0x00f0ff);
    const magenta = new THREE.Color(0xff007f);
    const white = new THREE.Color(0xffffff);
    const amber = new THREE.Color(0xffb700);

    for (let i = 0; i < VORTEX_PARTICLES; i++) {
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 26;
      const distFromCenter = Math.abs(height / 13); // 0..1
      const radius = 0.5 + distFromCenter * 7.5 + Math.random() * 1.5;

      this.plasmaAngles[i] = angle;
      this.plasmaRadii[i] = radius;
      this.plasmaHeights[i] = height;
      this.plasmaSpeeds[i] = (0.5 + Math.random() * 1.2) * (Math.random() > 0.5 ? 1 : -1);

      this.plasmaPositions[i * 3] = Math.cos(angle) * radius;
      this.plasmaPositions[i * 3 + 1] = height;
      this.plasmaPositions[i * 3 + 2] = Math.sin(angle) * radius;

      const rand = Math.random();
      const col = rand > 0.7 ? cyan : rand > 0.45 ? magenta : rand > 0.2 ? white : amber;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.plasmaPositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.plasmaParticles = new THREE.Points(geo, mat);
    this.scene.add(this.plasmaParticles);
  }

  private buildCore(): void {
    if (!this.scene) return;

    // Central glowing energy core
    const coreGeo = new THREE.SphereGeometry(1.2, 32, 32);
    this.coreMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x8800ff,
      emissiveIntensity: 2.0,
      roughness: 0.1,
      metalness: 0.9,
    });
    this.coreMesh = new THREE.Mesh(coreGeo, this.coreMaterial);
    this.scene.add(this.coreMesh);

    // Larger glow halo around core
    const glowGeo = new THREE.SphereGeometry(2.8, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x8800ff,
      transparent: true,
      opacity: 0.12,
    });
    this.coreGlowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.scene.add(this.coreGlowMesh);
  }

  private buildLightning(): void {
    if (!this.scene) return;

    for (let b = 0; b < LIGHTNING_BOLT_COUNT; b++) {
      // Each bolt is a jagged line from core outward
      const segmentCount = 12;
      const points = new Float32Array(segmentCount * 3);
      this.lightningPoints.push(points);

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(points, 3));

      const boltColor = b % 2 === 0 ? 0x00f0ff : 0xff007f;
      const mat = new THREE.LineBasicMaterial({
        color: boltColor,
        transparent: true,
        opacity: 0.8,
        linewidth: 1,
      });

      const line = new THREE.Line(geo, mat);
      this.lightningLines.push(line);
      this.lightningGeometries.push(geo);
      this.scene.add(line);
    }
  }

  /** Regenerates jagged lightning bolt from core to random outer position */
  private regenerateLightning(boltIdx: number, outerRadius: number, elapsedTime: number): void {
    const points = this.lightningPoints[boltIdx];
    const segmentCount = points.length / 3;
    const angle = (boltIdx / LIGHTNING_BOLT_COUNT) * Math.PI * 2 + elapsedTime * 0.3;
    const endX = Math.cos(angle) * outerRadius;
    const endY = (Math.random() - 0.5) * 10;
    const endZ = Math.sin(angle) * outerRadius;

    for (let s = 0; s < segmentCount; s++) {
      const t = s / (segmentCount - 1);
      const jitter = (1 - t) * 1.5;
      points[s * 3] = endX * t + (Math.random() - 0.5) * jitter;
      points[s * 3 + 1] = endY * t + (Math.random() - 0.5) * jitter;
      points[s * 3 + 2] = endZ * t + (Math.random() - 0.5) * jitter;
    }

    this.lightningGeometries[boltIdx].attributes.position.needsUpdate = true;
  }

  public update(elapsedTime: number, deltaTime: number, metrics: AudioMetrics): void {
    if (!this.camera) return;

    const pulse = metrics.beatPulse ?? 0;
    const isPlaying = metrics.isPlaying ?? (metrics.overall > 0.02);
    const { cameraShake, cameraShakeIntensity } = useVisualizerStore.getState();
    const shakeMult = cameraShake ? cameraShakeIntensity : 0.0;

    // 1. Vortex spin speed driven by audio energy
    const spinSpeed = isPlaying
      ? (1.2 + metrics.overall * 3.0 + pulse * 4.0) * deltaTime
      : 0.3 * deltaTime;
    this.vortexGroup.rotation.y += spinSpeed;

    // 2. Per-ring reactivity — frequency-driven scale and emissive
    for (let i = 0; i < this.ringMeshes.length; i++) {
      const frac = i / VORTEX_RINGS;
      const distFromCenter = Math.abs(frac - 0.5) * 2.0;

      // Outer rings react to bass, inner rings react to treble
      const freq = distFromCenter > 0.6 ? metrics.bass : distFromCenter > 0.3 ? metrics.mid : metrics.treble;

      const wave = Math.sin(elapsedTime * 5.5 - frac * Math.PI * 6 + pulse * 8) * 0.5 + 0.5;
      const scale = 1.0 + freq * 0.5 + wave * freq * 0.25 + pulse * 0.35;
      this.ringMeshes[i].scale.x = scale;
      this.ringMeshes[i].scale.z = scale;

      // Twist acceleration
      this.ringMeshes[i].rotation.z += (0.5 + freq * 1.5 + pulse * 2) * deltaTime * (i % 2 === 0 ? 1 : -1);

      this.ringMaterials[i].emissiveIntensity = 0.6 + freq * 2.5 + pulse * 3.5 + wave * freq;
      this.ringMaterials[i].opacity = 0.45 + freq * 0.35 + pulse * 0.15;
    }

    // 3. Plasma particles swirl and contract to beat
    if (this.plasmaParticles && this.plasmaPositions && this.plasmaAngles && this.plasmaRadii && this.plasmaHeights && this.plasmaSpeeds) {
      const swirl = isPlaying ? 1.2 + metrics.overall * 2.5 + pulse * 3 : 0.35;
      const suck = pulse * 0.25; // contract toward center on beat

      for (let i = 0; i < VORTEX_PARTICLES; i++) {
        this.plasmaAngles[i] += this.plasmaSpeeds[i] * swirl * deltaTime;

        // Bass suck: pull radius inward on kick then spring back
        this.plasmaRadii[i] = Math.max(0.3, this.plasmaRadii[i] - suck * deltaTime * 2.0);
        this.plasmaRadii[i] += (((Math.abs(this.plasmaHeights[i] / 13)) * 7.5 + 1.0) - this.plasmaRadii[i]) * 0.04;

        this.plasmaPositions[i * 3] = Math.cos(this.plasmaAngles[i]) * this.plasmaRadii[i];
        this.plasmaPositions[i * 3 + 1] = this.plasmaHeights[i];
        this.plasmaPositions[i * 3 + 2] = Math.sin(this.plasmaAngles[i]) * this.plasmaRadii[i];
      }
      (this.plasmaParticles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;

      const pmat = this.plasmaParticles.material as THREE.PointsMaterial;
      pmat.opacity = 0.45 + metrics.overall * 0.4 + pulse * 0.2;
      pmat.size = 0.1 + metrics.treble * 0.06 + pulse * 0.04;
    }

    // 4. Core breathes with bass
    if (this.coreMesh && this.coreMaterial) {
      const coreScale = 1.0 + metrics.bass * 0.8 + pulse * 1.2;
      this.coreMesh.scale.setScalar(coreScale);
      this.coreMaterial.emissiveIntensity = 1.5 + metrics.bass * 3.0 + pulse * 4.5;
    }
    if (this.coreGlowMesh) {
      const glowScale = 1.0 + metrics.overall * 1.2 + pulse * 1.5;
      this.coreGlowMesh.scale.setScalar(glowScale);
      (this.coreGlowMesh.material as THREE.MeshBasicMaterial).opacity = 0.08 + metrics.bass * 0.22 + pulse * 0.18;
    }

    // 5. Lightning arcs flash on beats
    const showLightning = pulse > 0.25 || metrics.rawBass > 0.4;
    const lightRadius = 4 + metrics.bass * 5 + pulse * 4;
    for (let b = 0; b < LIGHTNING_BOLT_COUNT; b++) {
      const lmat = this.lightningLines[b].material as THREE.LineBasicMaterial;
      if (showLightning) {
        this.regenerateLightning(b, lightRadius, elapsedTime);
        lmat.opacity = 0.5 + pulse * 0.5;
      } else {
        lmat.opacity = Math.max(0, lmat.opacity - deltaTime * 4.0);
      }
    }

    // 6. Reactive lights
    if (this.coreLight) {
      this.coreLight.intensity = 7 + metrics.bass * 18 + pulse * 25;
    }
    if (this.outerLight1) {
      this.outerLight1.intensity = 4 + metrics.treble * 10 + pulse * 12;
      this.outerLight1.position.set(
        Math.sin(elapsedTime * 0.6) * 12,
        Math.cos(elapsedTime * 0.5) * 8,
        6
      );
    }
    if (this.outerLight2) {
      this.outerLight2.intensity = 3.5 + metrics.mid * 8 + pulse * 10;
      this.outerLight2.position.set(
        Math.cos(elapsedTime * 0.55) * 12,
        Math.sin(elapsedTime * 0.7) * 8,
        6
      );
    }

    // 7. Camera orbital path + shake
    const camAngle = elapsedTime * 0.18;
    const camRadius = 28 + Math.sin(elapsedTime * 0.3) * 3;
    this.camera.position.x = Math.sin(camAngle) * camRadius * 0.4 + metrics.rawBass * 0.6 * Math.sin(elapsedTime * 3) * shakeMult;
    this.camera.position.y = 4 + Math.cos(elapsedTime * 0.22) * 4;
    this.camera.position.z = Math.cos(camAngle) * camRadius;
    this.camera.lookAt(0, 0, 0);

    const targetFov = this.baseFov + metrics.bass * 8 + pulse * 12;
    this.camera.fov += (targetFov - this.camera.fov) * 0.38;
    this.camera.updateProjectionMatrix();
  }

  public applyPalette(palette: ColorPalette): void {
    if (this.scene?.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.setHex(palette.bgHex);
    }
    if (this.coreLight) this.coreLight.color.setHex(palette.accentHex);
    if (this.outerLight1) this.outerLight1.color.setHex(palette.primaryHex);
    if (this.outerLight2) this.outerLight2.color.setHex(palette.secondaryHex);

    for (let i = 0; i < this.lightningLines.length; i++) {
      const mat = this.lightningLines[i].material as THREE.LineBasicMaterial;
      mat.color.setHex(i % 2 === 0 ? palette.primaryHex : palette.secondaryHex);
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
      this.scene.remove(this.vortexGroup);
      if (this.plasmaParticles) this.scene.remove(this.plasmaParticles);
      if (this.coreMesh) this.scene.remove(this.coreMesh);
      if (this.coreGlowMesh) this.scene.remove(this.coreGlowMesh);
      if (this.ambientLight) this.scene.remove(this.ambientLight);
      if (this.coreLight) this.scene.remove(this.coreLight);
      if (this.outerLight1) this.scene.remove(this.outerLight1);
      if (this.outerLight2) this.scene.remove(this.outerLight2);
      for (const line of this.lightningLines) this.scene.remove(line);
    }

    for (const mat of this.ringMaterials) mat.dispose();
    if (this.plasmaParticles) {
      this.plasmaParticles.geometry.dispose();
      (this.plasmaParticles.material as THREE.Material).dispose();
    }
    if (this.coreMaterial) this.coreMaterial.dispose();
    if (this.coreGlowMesh) {
      this.coreGlowMesh.geometry.dispose();
      (this.coreGlowMesh.material as THREE.Material).dispose();
    }
    for (const geo of this.lightningGeometries) geo.dispose();

    this.ringMeshes = [];
    this.ringMaterials = [];
    this.lightningLines = [];
    this.lightningGeometries = [];
  }
}
