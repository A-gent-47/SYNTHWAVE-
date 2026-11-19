import * as THREE from 'three';
import { VisualizerScene } from './SceneBase';
import { AudioMetrics } from '../../audio/types';
import { ColorPalette } from '../presets';
import { useVisualizerStore } from '../../store/visualizerStore';

interface TunnelSegment {
  group: THREE.Group;
  outerFrame: THREE.Mesh;
  innerFrame: THREE.Mesh;
  accentLights: THREE.Mesh[];
  baseZ: number;
  type: 'bulkhead' | 'rib';
}

export class NeonTunnelScene implements VisualizerScene {
  public id = 'neon-tunnel';
  public name = '01 // NEON TUNNEL';

  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;

  // Tunnel Architecture
  private tunnelGroup = new THREE.Group();
  private segments: TunnelSegment[] = [];
  private readonly segmentCount = 36;
  private readonly segmentSpacing = 4.2;
  private readonly tunnelDepth = 36 * 4.2; // ~151.2 units

  // Longitudinal Energy Conduits (Top, Bottom, Left, Right)
  private conduitLines: THREE.Line[] = [];
  private conduitGeometries: THREE.BufferGeometry[] = [];

  // Foreground Entrance Arch for Parallax
  private foregroundArch: THREE.Group | null = null;

  // Vanishing Singularity Core
  private singularityMesh: THREE.Mesh | null = null;
  private singularityLight: THREE.PointLight | null = null;

  // Warp Streaks
  private streakPoints: THREE.Points | null = null;
  private streakGeometry: THREE.BufferGeometry | null = null;
  private readonly streakCount = 900;
  private streakPositions: Float32Array | null = null;
  private streakVelocities: Float32Array | null = null;

  // Shared Geometries & Materials
  private bulkheadOuterGeo: THREE.TorusGeometry | null = null;
  private bulkheadInnerGeo: THREE.TorusGeometry | null = null;
  private ribOuterGeo: THREE.TorusGeometry | null = null;
  private ribInnerGeo: THREE.TorusGeometry | null = null;
  private chevronGeo: THREE.BoxGeometry | null = null;

  private hullMaterial: THREE.MeshStandardMaterial | null = null;
  private primaryEmissiveMat: THREE.MeshStandardMaterial | null = null;
  private secondaryEmissiveMat: THREE.MeshStandardMaterial | null = null;
  private accentEmissiveMat: THREE.MeshStandardMaterial | null = null;

  // Lighting
  private ambientLight: THREE.AmbientLight | null = null;
  private travelerLight: THREE.PointLight | null = null;

  // Camera & Motion
  private readonly baseFov = 68;
  private camRoll = 0;
  private camSway = 0;

  public init(scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
    this.scene = scene;
    this.camera = camera;

    this.camera.position.set(0, 0, 0);
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();

    // Atmospheric neon depth fog
    scene.fog = new THREE.FogExp2(0x040208, 0.018);

    // Setup Lighting
    this.ambientLight = new THREE.AmbientLight(0x0e071a, 1.2);
    scene.add(this.ambientLight);

    this.travelerLight = new THREE.PointLight(0x00f0ff, 4.0, 50);
    this.travelerLight.position.set(0, 0, -8);
    scene.add(this.travelerLight);

    // Build Materials
    this.buildMaterials();

    // Build Tunnel Segments
    this.buildSegments();
    scene.add(this.tunnelGroup);

    // Build Longitudinal Conduits
    this.buildConduits();

    // Build Foreground Arch
    this.buildForegroundArch();

    // Build Singularity Core at vanishing point
    this.buildSingularity();

    // Build Warp Streaks
    this.buildWarpStreaks();
  }

  private buildMaterials(): void {
    // Dark matte structural hull material
    this.hullMaterial = new THREE.MeshStandardMaterial({
      color: 0x0c0c16,
      roughness: 0.85,
      metalness: 0.25
    });

    // High-contrast glowing neon materials
    this.primaryEmissiveMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 1.5,
      roughness: 0.3,
      metalness: 0.8
    });

    this.secondaryEmissiveMat = new THREE.MeshStandardMaterial({
      color: 0xff007f,
      emissive: 0xff007f,
      emissiveIntensity: 1.5,
      roughness: 0.3,
      metalness: 0.8
    });

    this.accentEmissiveMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xffaa00,
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.9
    });
  }

  private buildSegments(): void {
    // Octagonal heavy bulkheads
    this.bulkheadOuterGeo = new THREE.TorusGeometry(3.8, 0.14, 8, 8);
    this.bulkheadInnerGeo = new THREE.TorusGeometry(3.55, 0.05, 8, 8);

    // Hexagonal intermediate structural ribs
    this.ribOuterGeo = new THREE.TorusGeometry(3.4, 0.08, 6, 6);
    this.ribInnerGeo = new THREE.TorusGeometry(3.25, 0.04, 6, 6);

    // Geometric light chevron beacon
    this.chevronGeo = new THREE.BoxGeometry(0.12, 0.45, 0.12);

    for (let i = 0; i < this.segmentCount; i++) {
      const isBulkhead = i % 3 === 0;
      const group = new THREE.Group();
      const zPos = 8 - i * this.segmentSpacing;

      let outerFrame: THREE.Mesh;
      let innerFrame: THREE.Mesh;
      const accentLights: THREE.Mesh[] = [];

      if (isBulkhead) {
        outerFrame = new THREE.Mesh(this.bulkheadOuterGeo, this.hullMaterial!);
        innerFrame = new THREE.Mesh(
          this.bulkheadInnerGeo,
          i % 6 === 0 ? this.primaryEmissiveMat! : this.secondaryEmissiveMat!
        );
        group.add(outerFrame);
        group.add(innerFrame);

        // Add 4 cardinal light chevrons
        for (let c = 0; c < 4; c++) {
          const angle = (c * Math.PI) / 2;
          const chevron = new THREE.Mesh(this.chevronGeo, this.accentEmissiveMat!);
          chevron.position.set(Math.cos(angle) * 3.85, Math.sin(angle) * 3.85, 0);
          chevron.rotation.z = angle;
          group.add(chevron);
          accentLights.push(chevron);
        }
      } else {
        outerFrame = new THREE.Mesh(this.ribOuterGeo, this.hullMaterial!);
        innerFrame = new THREE.Mesh(
          this.ribInnerGeo,
          i % 2 === 0 ? this.primaryEmissiveMat! : this.secondaryEmissiveMat!
        );
        group.add(outerFrame);
        group.add(innerFrame);
      }

      // Subtle continuous architectural twist
      group.position.set(0, 0, zPos);
      group.rotation.z = (i * Math.PI) / 18;

      this.tunnelGroup.add(group);
      this.segments.push({
        group,
        outerFrame,
        innerFrame,
        accentLights,
        baseZ: zPos,
        type: isBulkhead ? 'bulkhead' : 'rib'
      });
    }
  }

  private buildConduits(): void {
    if (!this.scene) return;

    // 4 continuous energy conduits running the length of the tunnel
    const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    const radius = 3.6;
    const pointsCount = 48;

    for (let a = 0; a < angles.length; a++) {
      const angle = angles[a];
      const positions = new Float32Array(pointsCount * 3);
      const baseX = Math.cos(angle) * radius;
      const baseY = Math.sin(angle) * radius;

      for (let p = 0; p < pointsCount; p++) {
        const z = 10 - (p / (pointsCount - 1)) * (this.tunnelDepth + 20);
        positions[p * 3] = baseX;
        positions[p * 3 + 1] = baseY;
        positions[p * 3 + 2] = z;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      this.conduitGeometries.push(geo);

      const mat = new THREE.LineBasicMaterial({
        color: a % 2 === 0 ? 0x00f0ff : 0xff007f,
        transparent: true,
        opacity: 0.75
      });

      const line = new THREE.Line(geo, mat);
      this.scene.add(line);
      this.conduitLines.push(line);
    }
  }

  private buildForegroundArch(): void {
    if (!this.scene) return;
    this.foregroundArch = new THREE.Group();
    const archGeo = new THREE.TorusGeometry(4.3, 0.22, 8, 8);
    const archGlowGeo = new THREE.TorusGeometry(4.05, 0.08, 8, 8);

    const archMesh = new THREE.Mesh(archGeo, this.hullMaterial!);
    const glowMesh = new THREE.Mesh(archGlowGeo, this.accentEmissiveMat!);

    this.foregroundArch.add(archMesh);
    this.foregroundArch.add(glowMesh);
    this.foregroundArch.position.set(0, 0, 4);
    this.scene.add(this.foregroundArch);
  }

  private buildSingularity(): void {
    if (!this.scene) return;
    const singularityGeo = new THREE.IcosahedronGeometry(1.6, 2);
    const singularityMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true
    });
    this.singularityMesh = new THREE.Mesh(singularityGeo, singularityMat);
    this.singularityMesh.position.set(0, 0, -this.tunnelDepth);
    this.scene.add(this.singularityMesh);

    this.singularityLight = new THREE.PointLight(0x00f0ff, 6.0, 60);
    this.singularityLight.position.set(0, 0, -this.tunnelDepth + 4);
    this.scene.add(this.singularityLight);
  }

  private buildWarpStreaks(): void {
    if (!this.scene) return;

    this.streakPositions = new Float32Array(this.streakCount * 3);
    this.streakVelocities = new Float32Array(this.streakCount);
    const colors = new Float32Array(this.streakCount * 3);

    const colCyan = new THREE.Color(0x00f0ff);
    const colMagenta = new THREE.Color(0xff007f);
    const colWhite = new THREE.Color(0xffffff);

    for (let i = 0; i < this.streakCount; i++) {
      const radius = 0.4 + Math.random() * 2.8;
      const angle = Math.random() * Math.PI * 2;

      this.streakPositions[i * 3] = Math.cos(angle) * radius;
      this.streakPositions[i * 3 + 1] = Math.sin(angle) * radius;
      this.streakPositions[i * 3 + 2] = 5 - Math.random() * (this.tunnelDepth + 10);

      this.streakVelocities[i] = 0.8 + Math.random() * 1.6;

      const pick = Math.random();
      const col = pick < 0.4 ? colCyan : pick < 0.75 ? colMagenta : colWhite;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    this.streakGeometry = new THREE.BufferGeometry();
    this.streakGeometry.setAttribute('position', new THREE.BufferAttribute(this.streakPositions, 3));
    this.streakGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const streakMaterial = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.streakPoints = new THREE.Points(this.streakGeometry, streakMaterial);
    this.scene.add(this.streakPoints);
  }

  public update(elapsedTime: number, deltaTime: number, metrics: AudioMetrics): void {
    const store = useVisualizerStore.getState();
    const isPlaying = metrics.overall > 0.01;
    const speed = store.motionSpeed * (isPlaying ? 1.0 + metrics.bass * 0.85 : 0.28);
    const beatPulse = (typeof metrics.beatPulse === 'number') ? metrics.beatPulse : 0;
    const bassPulse = beatPulse * store.bassSensitivity;
    const shakeMult = store.cameraShake ? store.cameraShakeIntensity : 0.0;

    // 1. Advance and recycle architectural segments down Z axis
    const moveZ = speed * deltaTime * 22.0;
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      seg.group.position.z += moveZ;

      if (seg.group.position.z > 8) {
        seg.group.position.z -= this.tunnelDepth;
      }

      // Audio reactive dilation based on distance and type
      const distFromCam = Math.abs(seg.group.position.z);
      const wavePhase = (distFromCam * 0.12 - elapsedTime * 4.0);
      const ripple = Math.sin(wavePhase) * metrics.mid * 0.16;

      let scale = 1.0 + ripple;
      if (seg.type === 'bulkhead') {
        scale += bassPulse * 0.22 * Math.exp(-distFromCam * 0.04);
      } else {
        scale += metrics.mid * 0.12;
      }

      seg.group.scale.set(scale, scale, 1.0);

      // Accent light brightness pulsing to treble
      for (let c = 0; c < seg.accentLights.length; c++) {
        seg.accentLights[c].scale.setScalar(1.0 + metrics.treble * 0.8);
      }
    }

    // 2. Animate Warp Streaks
    if (this.streakPositions && this.streakVelocities && this.streakGeometry) {
      const streakSpeed = moveZ * 1.8 + metrics.treble * 1.4;
      for (let i = 0; i < this.streakCount; i++) {
        let z = this.streakPositions[i * 3 + 2] + this.streakVelocities[i] * streakSpeed;
        if (z > 5) {
          z = -this.tunnelDepth + Math.random() * 8;
        }
        this.streakPositions[i * 3 + 2] = z;
      }
      this.streakGeometry.attributes.position.needsUpdate = true;
    }

    // 3. Singularity Core rotation and bass pulse
    if (this.singularityMesh) {
      this.singularityMesh.rotation.x = elapsedTime * 0.6;
      this.singularityMesh.rotation.y = elapsedTime * 0.9;
      const sScale = 1.0 + bassPulse * 0.65;
      this.singularityMesh.scale.set(sScale, sScale, sScale);
    }
    if (this.singularityLight) {
      this.singularityLight.intensity = 4.0 + bassPulse * 8.0 + metrics.treble * 3.0;
    }

    // 4. Traveler Light
    if (this.travelerLight) {
      const lightZ = -12 + Math.sin(elapsedTime * 1.8) * 10;
      this.travelerLight.position.z = lightZ;
      this.travelerLight.intensity = 3.5 + metrics.bass * 4.5 + bassPulse * 3.0;
    }

    // 5. Cinematic Architectural Camera Motion
    if (this.camera) {
      this.camRoll = THREE.MathUtils.lerp(
        this.camRoll,
        Math.sin(elapsedTime * 0.45) * 0.06 * (1 + metrics.overall * 0.5),
        0.08
      );
      this.camSway = THREE.MathUtils.lerp(
        this.camSway,
        Math.cos(elapsedTime * 0.35) * 0.25,
        0.08
      );

      const shakeX = (Math.random() - 0.5) * 0.08 * bassPulse * shakeMult;
      const shakeY = (Math.random() - 0.5) * 0.08 * bassPulse * shakeMult;

      this.camera.position.x = this.camSway + shakeX;
      this.camera.position.y = Math.sin(elapsedTime * 0.6) * 0.15 + shakeY;
      this.camera.rotation.z = this.camRoll;

      // FOV thump on beats
      const targetFov = this.baseFov + bassPulse * 8.0 + metrics.bass * 4.0;
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 0.32);
      this.camera.updateProjectionMatrix();
    }
  }

  public applyPalette(palette: ColorPalette): void {
    if (this.scene?.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.setHex(palette.bgHex);
    }
    if (this.primaryEmissiveMat) {
      this.primaryEmissiveMat.color.setHex(palette.primaryHex);
      this.primaryEmissiveMat.emissive.setHex(palette.primaryHex);
    }
    if (this.secondaryEmissiveMat) {
      this.secondaryEmissiveMat.color.setHex(palette.secondaryHex);
      this.secondaryEmissiveMat.emissive.setHex(palette.secondaryHex);
    }
    if (this.accentEmissiveMat) {
      this.accentEmissiveMat.color.setHex(palette.accentHex);
      this.accentEmissiveMat.emissive.setHex(palette.accentHex);
    }
    if (this.travelerLight) {
      this.travelerLight.color.setHex(palette.primaryHex);
    }
    if (this.singularityLight) {
      this.singularityLight.color.setHex(palette.accentHex);
    }
    if (this.singularityMesh) {
      (this.singularityMesh.material as THREE.MeshBasicMaterial).color.setHex(palette.primaryHex);
    }

    for (let i = 0; i < this.conduitLines.length; i++) {
      const mat = this.conduitLines[i].material as THREE.LineBasicMaterial;
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
      this.scene.remove(this.tunnelGroup);
      if (this.foregroundArch) this.scene.remove(this.foregroundArch);
      if (this.singularityMesh) this.scene.remove(this.singularityMesh);
      if (this.singularityLight) this.scene.remove(this.singularityLight);
      if (this.streakPoints) this.scene.remove(this.streakPoints);
      if (this.ambientLight) this.scene.remove(this.ambientLight);
      if (this.travelerLight) this.scene.remove(this.travelerLight);

      for (const line of this.conduitLines) {
        this.scene.remove(line);
      }
    }

    // Geometries
    this.bulkheadOuterGeo?.dispose();
    this.bulkheadInnerGeo?.dispose();
    this.ribOuterGeo?.dispose();
    this.ribInnerGeo?.dispose();
    this.chevronGeo?.dispose();
    this.streakGeometry?.dispose();
    for (const g of this.conduitGeometries) g.dispose();

    // Materials
    this.hullMaterial?.dispose();
    this.primaryEmissiveMat?.dispose();
    this.secondaryEmissiveMat?.dispose();
    this.accentEmissiveMat?.dispose();

    if (this.singularityMesh) {
      (this.singularityMesh.geometry as THREE.BufferGeometry).dispose();
      (this.singularityMesh.material as THREE.Material).dispose();
    }
    if (this.streakPoints) {
      (this.streakPoints.material as THREE.Material).dispose();
    }
    for (const line of this.conduitLines) {
      (line.material as THREE.Material).dispose();
    }

    this.segments = [];
    this.conduitLines = [];
    this.conduitGeometries = [];
    while (this.tunnelGroup.children.length > 0) {
      this.tunnelGroup.remove(this.tunnelGroup.children[0]);
    }
  }
}
