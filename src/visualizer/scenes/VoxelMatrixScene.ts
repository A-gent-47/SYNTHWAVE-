import * as THREE from 'three';
import { VisualizerScene } from './SceneBase';
import { AudioMetrics } from '../../audio/types';
import { ColorPalette } from '../presets';
import { useVisualizerStore } from '../../store/visualizerStore';

/**
 * SCENE 5 — VOXEL MATRIX ("OBSIDIAN KINETIC CITY")
 *
 * A cinematic, precision-engineered architectural field of obsidian monoliths
 * with luminescent emitter crowns. Movement reveals the rhythm, spatial structure,
 * and frequency topology of the music.
 *
 * Distinct audio responsibilities:
 * - Bass: Outward-propagating kinetic shockwaves lofting monoliths in continuous ripples.
 * - Mids: Rolling topographical wave swells and regional quadrant height profiles.
 * - Treble: High-frequency luminescent cap activation, edge glints, and beacon bursts.
 * - FFT: Spatially organized from central avenues (lows) to outer sectors (highs).
 */
export class VoxelMatrixScene implements VisualizerScene {
  public id = 'voxel-matrix';
  public name = '05 // VOXEL MATRIX';

  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;

  // 24x24 = 576 instances (or 16x16 = 256 in Reduced Effects)
  private gridSize = 24;
  private totalInstances = 576;
  private readonly pillarWidth = 0.58;
  private readonly pillarSpacing = 0.78;

  // Dual-Tier Architecture: Obsidian Monolith Bodies + Luminous Top Caps
  private bodyMesh: THREE.InstancedMesh | null = null;
  private capMesh: THREE.InstancedMesh | null = null;
  private bodyGeo: THREE.BoxGeometry | null = null;
  private capGeo: THREE.BoxGeometry | null = null;
  private bodyMat: THREE.MeshStandardMaterial | null = null;
  private capMat: THREE.MeshStandardMaterial | null = null;

  // Architectural Base Foundation & Recessed Grid Channels
  private basePlatform: THREE.Mesh | null = null;
  private basePlatformGeo: THREE.BoxGeometry | null = null;
  private circuitGrid: THREE.LineSegments | null = null;
  private circuitGridGeo: THREE.BufferGeometry | null = null;

  // Precomputed spatial coordinate maps (ZERO per-frame allocation)
  private cellDistances: Float32Array | null = null;
  private cellBaseX: Float32Array | null = null;
  private cellBaseZ: Float32Array | null = null;
  private cellBaseHeight: Float32Array | null = null; // Architectural skyline at idle
  private cellQuadrant: Float32Array | null = null;

  // Pre-allocated scratch objects for matrix & color updates
  private readonly dummyMatrix = new THREE.Matrix4();
  private readonly dummyPosition = new THREE.Vector3();
  private readonly dummyScale = new THREE.Vector3();
  private readonly dummyQuaternion = new THREE.Quaternion();
  private readonly dummyColor = new THREE.Color();
  private readonly colPrimary = new THREE.Color(0x00f0ff);
  private readonly colSecondary = new THREE.Color(0xff007f);
  private readonly colAccent = new THREE.Color(0xffaa00);
  private readonly colObsidian = new THREE.Color(0x0c0b14);

  // Cinematic Lighting & Atmosphere
  private overheadLight: THREE.PointLight | null = null;
  private grazingRimLight: THREE.DirectionalLight | null = null;
  private ambientLight: THREE.AmbientLight | null = null;

  // Isometric Camera Kinematics
  private readonly baseFov = 48;
  private orbitAngle = 0.45;

  public init(scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
    this.scene = scene;
    this.camera = camera;

    const store = useVisualizerStore.getState();
    this.gridSize = store.reducedEffects ? 16 : 24;
    this.totalInstances = this.gridSize * this.gridSize;

    // Dramatic 36-degree elevated isometric camera framing
    this.camera.position.set(18.5, 17.0, 18.5);
    this.camera.lookAt(0, 1.2, 0);
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();

    // Deep obsidian atmospheric fog
    scene.fog = new THREE.FogExp2(0x05040a, 0.021);

    // Setup Lighting
    this.ambientLight = new THREE.AmbientLight(0x0e0c18, 1.6);
    scene.add(this.ambientLight);

    // Overhead cyan key light
    this.overheadLight = new THREE.PointLight(0x00f0ff, 4.8, 45);
    this.overheadLight.position.set(0, 15, 0);
    scene.add(this.overheadLight);

    // Low-angle grazing rim light casting sharp metallic reflections across bevels
    this.grazingRimLight = new THREE.DirectionalLight(0xff007f, 1.8);
    this.grazingRimLight.position.set(-20, 14, -20);
    scene.add(this.grazingRimLight);

    // Build the Obsidian Kinetic City
    this.setupFoundation();
    this.setupMonolithGrid();
  }

  /**
   * Builds the subterranean circuit channels and dark foundation platform
   */
  private setupFoundation(): void {
    if (!this.scene) return;

    const platWidth = this.gridSize * this.pillarSpacing + 2.5;
    this.basePlatformGeo = new THREE.BoxGeometry(platWidth, 0.6, platWidth);
    const platMat = new THREE.MeshStandardMaterial({
      color: 0x07060e,
      roughness: 0.85,
      metalness: 0.45
    });

    this.basePlatform = new THREE.Mesh(this.basePlatformGeo, platMat);
    this.basePlatform.position.set(0, -0.32, 0);
    this.scene.add(this.basePlatform);

    // Recessed luminous circuit grid channels beneath monolith alleys
    const half = (this.gridSize - 1) / 2;
    const lineCoords: number[] = [];
    for (let i = 0; i < this.gridSize; i++) {
      const coord = (i - half) * this.pillarSpacing;
      const minP = -half * this.pillarSpacing - 0.4;
      const maxP = half * this.pillarSpacing + 0.4;

      // X parallel channels
      lineCoords.push(minP, 0.01, coord, maxP, 0.01, coord);
      // Z parallel channels
      lineCoords.push(coord, 0.01, minP, coord, 0.01, maxP);
    }

    this.circuitGridGeo = new THREE.BufferGeometry();
    this.circuitGridGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineCoords, 3));
    const gridLineMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.28
    });
    this.circuitGrid = new THREE.LineSegments(this.circuitGridGeo, gridLineMat);
    this.scene.add(this.circuitGrid);
  }

  /**
   * Builds the dual-tier monolith field: obsidian bodies + luminous caps
   */
  private setupMonolithGrid(): void {
    if (!this.scene) return;

    // 1. Obsidian Pillar Body: Sleek dark satin metal
    this.bodyGeo = new THREE.BoxGeometry(this.pillarWidth, 1.0, this.pillarWidth);
    this.bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0c0b16,
      roughness: 0.22,
      metalness: 0.82,
      emissive: 0x030308,
      emissiveIntensity: 0.2
    });
    this.bodyMesh = new THREE.InstancedMesh(this.bodyGeo, this.bodyMat, this.totalInstances);

    // 2. Luminous Emitter Cap: Crown placed on top of each pillar
    this.capGeo = new THREE.BoxGeometry(this.pillarWidth * 0.94, 0.09, this.pillarWidth * 0.94);
    this.capMat = new THREE.MeshStandardMaterial({
      color: 0x111122,
      roughness: 0.15,
      metalness: 0.9,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.6
    });
    this.capMesh = new THREE.InstancedMesh(this.capGeo, this.capMat, this.totalInstances);

    // Preallocate coordinate and topological caches
    this.cellDistances = new Float32Array(this.totalInstances);
    this.cellBaseX = new Float32Array(this.totalInstances);
    this.cellBaseZ = new Float32Array(this.totalInstances);
    this.cellBaseHeight = new Float32Array(this.totalInstances);
    this.cellQuadrant = new Float32Array(this.totalInstances);

    const halfGrid = (this.gridSize - 1) / 2;
    const maxRadius = Math.sqrt(halfGrid * halfGrid * 2);

    let idx = 0;
    for (let x = 0; x < this.gridSize; x++) {
      for (let z = 0; z < this.gridSize; z++) {
        const posX = (x - halfGrid) * this.pillarSpacing;
        const posZ = (z - halfGrid) * this.pillarSpacing;
        const dist = Math.sqrt(posX * posX + posZ * posZ);
        const normDist = dist / (maxRadius * this.pillarSpacing);

        this.cellBaseX[idx] = posX;
        this.cellBaseZ[idx] = posZ;
        this.cellDistances[idx] = normDist;

        // Quadrant angle (-PI to PI)
        this.cellQuadrant[idx] = Math.atan2(posZ, posX);

        // Precompute architectural city skyline at idle
        // Central grand boulevard, concentric plaza rings, and perimeter terrace steps
        const avenue = (Math.abs(posX) < 0.8 || Math.abs(posZ) < 0.8) ? 0.35 : 0.0;
        const terrace = Math.sin(normDist * Math.PI * 3.0) * 0.25;
        const skylineBase = 0.45 + (1.0 - normDist) * 0.65 + terrace - avenue;
        this.cellBaseHeight[idx] = Math.max(0.2, skylineBase);

        // Initialize transformation matrices
        this.dummyPosition.set(posX, this.cellBaseHeight[idx] * 0.5, posZ);
        this.dummyScale.set(1.0, this.cellBaseHeight[idx], 1.0);
        this.dummyQuaternion.identity();
        this.dummyMatrix.compose(this.dummyPosition, this.dummyQuaternion, this.dummyScale);
        this.bodyMesh.setMatrixAt(idx, this.dummyMatrix);

        // Position cap directly on top of pillar body
        this.dummyPosition.set(posX, this.cellBaseHeight[idx] + 0.045, posZ);
        this.dummyScale.set(1.0, 1.0, 1.0);
        this.dummyMatrix.compose(this.dummyPosition, this.dummyQuaternion, this.dummyScale);
        this.capMesh.setMatrixAt(idx, this.dummyMatrix);

        // Default colors
        this.bodyMesh.setColorAt(idx, this.colObsidian);
        this.capMesh.setColorAt(idx, this.colPrimary);

        idx++;
      }
    }

    this.bodyMesh.instanceMatrix.needsUpdate = true;
    if (this.bodyMesh.instanceColor) this.bodyMesh.instanceColor.needsUpdate = true;

    this.capMesh.instanceMatrix.needsUpdate = true;
    if (this.capMesh.instanceColor) this.capMesh.instanceColor.needsUpdate = true;

    this.scene.add(this.bodyMesh);
    this.scene.add(this.capMesh);
  }

  public update(elapsedTime: number, deltaTime: number, metrics: AudioMetrics): void {
    const store = useVisualizerStore.getState();
    const isPlaying = metrics.overall > 0.01;
    const speedMult = store.motionSpeed * (isPlaying ? 1.0 + metrics.mid * 0.75 : 0.28);
    const beatPulse = (typeof metrics.beatPulse === 'number') ? metrics.beatPulse : 0;
    const bassPulse = beatPulse * store.bassSensitivity;
    const shakeMult = store.cameraShake ? store.cameraShakeIntensity : 0.0;

    // 1. Update Monolith Bodies & Luminous Caps
    if (this.bodyMesh && this.capMesh && this.cellBaseX && this.cellBaseZ && this.cellDistances && this.cellBaseHeight && this.cellQuadrant) {
      const freqData = metrics.frequencyData;
      const freqLen = Math.min(180, freqData.length);

      // Traveling radial bass shockwave phase
      const shockwavePhase = elapsedTime * 4.8 * speedMult;
      // Rolling mid-frequency wave phase
      const midWavePhase = elapsedTime * 2.2 * speedMult;

      for (let i = 0; i < this.totalInstances; i++) {
        const posX = this.cellBaseX[i];
        const posZ = this.cellBaseZ[i];
        const normDist = this.cellDistances[i];
        const quadAngle = this.cellQuadrant[i];
        const baseH = this.cellBaseHeight[i];

        // A. Spatially coherent FFT frequency assignment:
        // Lower frequencies map to central towers; higher frequencies to outer perimeter
        const binIdx = Math.floor(normDist * (freqLen - 1));
        const rawBin = freqData[binIdx] ? freqData[binIdx] / 255 : 0;
        const binVal = isPlaying ? rawBin : (Math.sin(normDist * 9.0 - elapsedTime * 2.5) * 0.2 + 0.2);

        // B. Bass Shockwave: Smoothly propagating radial wavefront
        const waveDist = normDist * 8.0 - shockwavePhase;
        const shockwave = Math.sin(waveDist) * (metrics.bass * 0.7 + bassPulse * 0.85);
        const shockwaveEnvelope = Math.max(0, 1.0 - Math.abs(Math.sin(waveDist * 0.5)));

        // C. Mid-Frequency Rolling Topographical Swell:
        // Harmonic quadrant waves creating organic rolling formations across city blocks
        const rollingSwell = (
          Math.sin(posX * 0.38 + midWavePhase) * Math.cos(posZ * 0.38 - midWavePhase * 0.8) +
          Math.sin(quadAngle * 3.0 + midWavePhase * 0.5) * 0.5
        ) * metrics.mid * 1.5 * store.midSensitivity;

        // D. Precision Height Calculation (clamped & smoothly bounded)
        const dynamicHeight = Math.max(
          0.18,
          baseH +
          binVal * 4.2 * store.midSensitivity +
          shockwave * shockwaveEnvelope * 2.4 +
          rollingSwell +
          bassPulse * (1.1 - normDist) * 1.8
        );

        // 1. Update Obsidian Pillar Body
        this.dummyPosition.set(posX, dynamicHeight * 0.5, posZ);
        this.dummyScale.set(1.0, dynamicHeight, 1.0);
        this.dummyQuaternion.identity();
        this.dummyMatrix.compose(this.dummyPosition, this.dummyQuaternion, this.dummyScale);
        this.bodyMesh.setMatrixAt(i, this.dummyMatrix);

        // 2. Update Luminous Emitter Cap (rides exactly at the summit of each pillar)
        this.dummyPosition.set(posX, dynamicHeight + 0.045, posZ);
        this.dummyScale.set(1.0, 1.0, 1.0);
        this.dummyMatrix.compose(this.dummyPosition, this.dummyQuaternion, this.dummyScale);
        this.capMesh.setMatrixAt(i, this.dummyMatrix);

        // 3. Dynamic Color Shading:
        // - Obsidian Body: Stays dark metallic graphite with subtle secondary edge rim
        const bodyRimT = Math.min(1.0, dynamicHeight / 6.0);
        this.dummyColor.copy(this.colObsidian).lerp(this.colSecondary, bodyRimT * 0.35);
        this.bodyMesh.setColorAt(i, this.dummyColor);

        // - Luminous Cap: Vivid audio-reactive beacon (Primary -> Secondary -> Treble Accent)
        const capEnergy = Math.min(1.0, dynamicHeight / 4.8);
        if (capEnergy < 0.55) {
          this.dummyColor.copy(this.colPrimary).lerp(this.colSecondary, capEnergy * 1.8);
        } else {
          const tAccent = (capEnergy - 0.55) * 2.2;
          this.dummyColor.copy(this.colSecondary).lerp(
            this.colAccent,
            Math.min(1.0, tAccent * (0.35 + metrics.treble * 0.85))
          );
        }
        this.capMesh.setColorAt(i, this.dummyColor);
      }

      this.bodyMesh.instanceMatrix.needsUpdate = true;
      if (this.bodyMesh.instanceColor) this.bodyMesh.instanceColor.needsUpdate = true;

      this.capMesh.instanceMatrix.needsUpdate = true;
      if (this.capMesh.instanceColor) this.capMesh.instanceColor.needsUpdate = true;
    }

    // 2. Reactive Architectural Lighting
    if (this.overheadLight) {
      this.overheadLight.intensity = 3.8 + bassPulse * 7.0 + metrics.mid * 2.4;
    }
    if (this.grazingRimLight) {
      this.grazingRimLight.intensity = 1.4 + metrics.treble * 1.8 + bassPulse * 1.2;
    }

    // 3. Isometric Orbit Camera with Subtle Parallax
    if (this.camera) {
      this.orbitAngle += deltaTime * 0.065 * speedMult;
      const orbitRadius = 23.5 - bassPulse * 1.6;
      const camHeight = 16.5 + Math.sin(elapsedTime * 0.2) * 1.8;

      const shakeX = (Math.random() - 0.5) * 0.08 * bassPulse * shakeMult;
      const shakeY = (Math.random() - 0.5) * 0.08 * bassPulse * shakeMult;

      this.camera.position.x = Math.sin(this.orbitAngle) * orbitRadius + shakeX;
      this.camera.position.y = camHeight + shakeY;
      this.camera.position.z = Math.cos(this.orbitAngle) * orbitRadius;
      this.camera.lookAt(0, 1.4, 0);

      const targetFov = this.baseFov + bassPulse * 3.8;
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 0.2);
      this.camera.updateProjectionMatrix();
    }
  }

  public applyPalette(palette: ColorPalette): void {
    if (this.scene?.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.setHex(palette.bgHex);
    }
    this.colPrimary.setHex(palette.primaryHex);
    this.colSecondary.setHex(palette.secondaryHex);
    this.colAccent.setHex(palette.accentHex);

    if (this.overheadLight) this.overheadLight.color.setHex(palette.primaryHex);
    if (this.grazingRimLight) this.grazingRimLight.color.setHex(palette.secondaryHex);
    if (this.circuitGrid) {
      (this.circuitGrid.material as THREE.LineBasicMaterial).color.setHex(palette.primaryHex);
    }
    if (this.capMat) {
      this.capMat.emissive.setHex(palette.primaryHex);
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
      if (this.bodyMesh) this.scene.remove(this.bodyMesh);
      if (this.capMesh) this.scene.remove(this.capMesh);
      if (this.basePlatform) this.scene.remove(this.basePlatform);
      if (this.circuitGrid) this.scene.remove(this.circuitGrid);
      if (this.overheadLight) this.scene.remove(this.overheadLight);
      if (this.grazingRimLight) this.scene.remove(this.grazingRimLight);
      if (this.ambientLight) this.scene.remove(this.ambientLight);
    }

    this.bodyGeo?.dispose();
    this.capGeo?.dispose();
    this.basePlatformGeo?.dispose();
    this.circuitGridGeo?.dispose();
    this.bodyMat?.dispose();
    this.capMat?.dispose();
    if (this.basePlatform) (this.basePlatform.material as THREE.Material).dispose();
    if (this.circuitGrid) (this.circuitGrid.material as THREE.Material).dispose();

    this.cellDistances = null;
    this.cellBaseX = null;
    this.cellBaseZ = null;
    this.cellBaseHeight = null;
    this.cellQuadrant = null;
  }
}
