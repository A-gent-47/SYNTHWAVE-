import * as THREE from 'three';
import { VisualizerScene } from './SceneBase';
import { AudioMetrics } from '../../audio/types';
import { ColorPalette } from '../presets';
import { useVisualizerStore } from '../../store/visualizerStore';

interface RidgelineRow {
  line: THREE.Line;
  ribbon: THREE.Mesh;
  lineGeo: THREE.BufferGeometry;
  ribbonGeo: THREE.BufferGeometry;
  linePositions: Float32Array;
  ribbonPositions: Float32Array;
}

export class WaveformRidgelineScene implements VisualizerScene {
  public id = 'waveform-ridgelines';
  public name = '06 // WAVEFORM RIDGELINES';

  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;

  // Topographic Waterfall Dimensions
  private rows = 48;
  private readonly cols = 64;
  private readonly stageWidth = 38;
  private readonly frontZ = 12;
  private readonly backZ = -45;

  // Historical elevation buffer: rows x cols
  private elevationBuffer: Float32Array | null = null;
  private gaussianWeights: Float32Array | null = null;

  // Visual structures for each row (Glowing Line + Occlusion Ribbon)
  private ridgelineRows: RidgelineRow[] = [];
  private ridgelineGroup = new THREE.Group();

  // Materials
  private lineMat: THREE.LineBasicMaterial | null = null;
  private ribbonMat: THREE.MeshBasicMaterial | null = null;

  // Lighting
  private stageLight: THREE.PointLight | null = null;
  private ambientLight: THREE.AmbientLight | null = null;

  // Regulated update timer
  private updateAccumulator = 0;
  private readonly tickInterval = 0.032; // ~30Hz waterfall flow

  // Camera Dynamics
  private readonly baseFov = 58;

  public init(scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
    this.scene = scene;
    this.camera = camera;

    const store = useVisualizerStore.getState();
    this.rows = store.reducedEffects ? 30 : 48;

    // Low-angle perspective camera looking down the waterfall horizon
    this.camera.position.set(0, 5.5, 20);
    this.camera.lookAt(0, 1.8, -15);
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();

    // Dark minimalist atmospheric fog
    scene.fog = new THREE.FogExp2(0x05050a, 0.022);

    // Setup Lighting
    this.ambientLight = new THREE.AmbientLight(0x0a0a14, 1.2);
    scene.add(this.ambientLight);

    this.stageLight = new THREE.PointLight(0x00f0ff, 4.0, 45);
    this.stageLight.position.set(0, 12, 5);
    scene.add(this.stageLight);

    // Pre-calculate Gaussian bell curve weights across cols
    this.gaussianWeights = new Float32Array(this.cols);
    const halfCols = (this.cols - 1) / 2;
    for (let c = 0; c < this.cols; c++) {
      const xNorm = (c - halfCols) / (halfCols * 0.48);
      this.gaussianWeights[c] = Math.exp(-0.5 * xNorm * xNorm);
    }

    // Allocate flat elevation buffer
    this.elevationBuffer = new Float32Array(this.rows * this.cols);

    // Build Rows
    this.setupRows();
    scene.add(this.ridgelineGroup);
  }

  private setupRows(): void {
    // Glowing crest line material
    this.lineMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      linewidth: 2,
      transparent: true,
      opacity: 0.95
    });

    // Dark matte occlusion ribbon material (blocks background ridges)
    this.ribbonMat = new THREE.MeshBasicMaterial({
      color: 0x050508,
      side: THREE.DoubleSide,
      depthWrite: true
    });

    const zStep = (this.backZ - this.frontZ) / (this.rows - 1);
    const halfWidth = this.stageWidth / 2;

    for (let r = 0; r < this.rows; r++) {
      const zPos = this.frontZ + r * zStep;

      // 1. Line Geometry: cols points
      const linePositions = new Float32Array(this.cols * 3);
      for (let c = 0; c < this.cols; c++) {
        const x = -halfWidth + (c / (this.cols - 1)) * this.stageWidth;
        linePositions[c * 3] = x;
        linePositions[c * 3 + 1] = 0;
        linePositions[c * 3 + 2] = zPos;
      }

      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
      const line = new THREE.Line(lineGeo, this.lineMat);
      this.ridgelineGroup.add(line);

      // 2. Occlusion Ribbon Geometry: (cols - 1) quad strips (2 triangles each = 6 vertices per segment)
      const ribbonPositions = new Float32Array((this.cols - 1) * 6 * 3);
      const ribbonGeo = new THREE.BufferGeometry();
      ribbonGeo.setAttribute('position', new THREE.BufferAttribute(ribbonPositions, 3));
      const ribbon = new THREE.Mesh(ribbonGeo, this.ribbonMat);
      // Ensure ribbon renders just behind line in depth
      ribbon.renderOrder = r;
      this.ridgelineGroup.add(ribbon);

      this.ridgelineRows.push({
        line,
        ribbon,
        lineGeo,
        ribbonGeo,
        linePositions,
        ribbonPositions
      });
    }
  }

  public update(elapsedTime: number, deltaTime: number, metrics: AudioMetrics): void {
    const store = useVisualizerStore.getState();
    const isPlaying = metrics.overall > 0.01;
    const speedMult = store.motionSpeed * (isPlaying ? 1.0 + metrics.mid * 0.7 : 0.28);
    const beatPulse = (typeof metrics.beatPulse === 'number') ? metrics.beatPulse : 0;
    const bassPulse = beatPulse * store.bassSensitivity;
    const shakeMult = store.cameraShake ? store.cameraShakeIntensity : 0.0;

    // Regulate row shifting interval (~30Hz scaled by motionSpeed)
    this.updateAccumulator += deltaTime * speedMult;
    if (this.updateAccumulator >= this.tickInterval && this.elevationBuffer && this.gaussianWeights) {
      this.updateAccumulator = 0;

      // Shift historical rows backward by 1 row
      for (let r = this.rows - 1; r > 0; r--) {
        const destOffset = r * this.cols;
        const srcOffset = (r - 1) * this.cols;
        for (let c = 0; c < this.cols; c++) {
          this.elevationBuffer[destOffset + c] = this.elevationBuffer[srcOffset + c];
        }
      }

      // Populate front-most row (r = 0) from live FFT frequency data shaped by Gaussian bell curve
      const freqData = metrics.frequencyData;
      const freqLen = Math.min(180, freqData.length);
      const halfCols = (this.cols - 1) / 2;

      for (let c = 0; c < this.cols; c++) {
        // Fold outer wings into low-mid bins, center into high-energy resonant bins
        const distFromCenter = Math.abs(c - halfCols) / halfCols;
        const binIdx = Math.floor(distFromCenter * (freqLen - 1));
        const rawEnergy = freqData[binIdx] ? freqData[binIdx] / 255 : (Math.sin(c * 0.4 + elapsedTime * 4) * 0.2 + 0.2);

        const bell = this.gaussianWeights[c];
        const wingRipple = Math.sin(c * 0.8 - elapsedTime * 5) * metrics.treble * 0.45;

        // Peak elevation
        const height = (rawEnergy * 3.8 * bell * store.bassSensitivity) +
                       (metrics.bass * 2.2 * bell) +
                       (bassPulse * 1.8 * bell) +
                       (wingRipple * (1 - bell));

        this.elevationBuffer[c] = Math.max(0.02, height);
      }

      // Update BufferGeometries for all rows in-place
      this.updateRowGeometries();
    }

    // Camera Gentle Sway & Horizon Look
    if (this.camera) {
      const swayX = Math.sin(elapsedTime * 0.4) * 1.2;
      const shakeX = (Math.random() - 0.5) * 0.08 * bassPulse * shakeMult;
      const shakeY = (Math.random() - 0.5) * 0.08 * bassPulse * shakeMult;

      this.camera.position.x = swayX + shakeX;
      this.camera.position.y = 5.5 + Math.sin(elapsedTime * 0.25) * 0.6 + shakeY;
      this.camera.position.z = 20 - bassPulse * 1.2;
      this.camera.lookAt(0, 1.8 + bassPulse * 0.5, -15);

      const targetFov = this.baseFov + bassPulse * 4.0;
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 0.22);
      this.camera.updateProjectionMatrix();
    }
  }

  private updateRowGeometries(): void {
    if (!this.elevationBuffer) return;
    const halfWidth = this.stageWidth / 2;
    const zStep = (this.backZ - this.frontZ) / (this.rows - 1);

    for (let r = 0; r < this.rows; r++) {
      const rowData = this.ridgelineRows[r];
      const zPos = this.frontZ + r * zStep;
      const bufOffset = r * this.cols;

      // 1. Update line positions
      const lp = rowData.linePositions;
      for (let c = 0; c < this.cols; c++) {
        const x = -halfWidth + (c / (this.cols - 1)) * this.stageWidth;
        const y = this.elevationBuffer[bufOffset + c];
        lp[c * 3] = x;
        lp[c * 3 + 1] = y;
        lp[c * 3 + 2] = zPos;
      }
      rowData.lineGeo.attributes.position.needsUpdate = true;

      // 2. Update occlusion ribbon mesh vertices (vertical skirt drop below line)
      const rp = rowData.ribbonPositions;
      let vertIdx = 0;
      const skirtBottomY = -1.5;

      for (let c = 0; c < this.cols - 1; c++) {
        const x1 = -halfWidth + (c / (this.cols - 1)) * this.stageWidth;
        const x2 = -halfWidth + ((c + 1) / (this.cols - 1)) * this.stageWidth;
        const y1 = this.elevationBuffer[bufOffset + c];
        const y2 = this.elevationBuffer[bufOffset + c + 1];

        // Triangle 1: (x1, y1) -> (x1, skirt) -> (x2, y2)
        rp[vertIdx++] = x1; rp[vertIdx++] = y1; rp[vertIdx++] = zPos;
        rp[vertIdx++] = x1; rp[vertIdx++] = skirtBottomY; rp[vertIdx++] = zPos;
        rp[vertIdx++] = x2; rp[vertIdx++] = y2; rp[vertIdx++] = zPos;

        // Triangle 2: (x2, y2) -> (x1, skirt) -> (x2, skirt)
        rp[vertIdx++] = x2; rp[vertIdx++] = y2; rp[vertIdx++] = zPos;
        rp[vertIdx++] = x1; rp[vertIdx++] = skirtBottomY; rp[vertIdx++] = zPos;
        rp[vertIdx++] = x2; rp[vertIdx++] = skirtBottomY; rp[vertIdx++] = zPos;
      }
      rowData.ribbonGeo.attributes.position.needsUpdate = true;
    }
  }

  public applyPalette(palette: ColorPalette): void {
    if (this.scene?.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.setHex(palette.bgHex);
    }
    if (this.lineMat) {
      this.lineMat.color.setHex(palette.primaryHex);
    }
    if (this.stageLight) {
      this.stageLight.color.setHex(palette.primaryHex);
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
      this.scene.remove(this.ridgelineGroup);
      if (this.stageLight) this.scene.remove(this.stageLight);
      if (this.ambientLight) this.scene.remove(this.ambientLight);
    }

    this.lineMat?.dispose();
    this.ribbonMat?.dispose();

    for (const r of this.ridgelineRows) {
      r.lineGeo.dispose();
      r.ribbonGeo.dispose();
      this.ridgelineGroup.remove(r.line);
      this.ridgelineGroup.remove(r.ribbon);
    }

    this.ridgelineRows = [];
    this.elevationBuffer = null;
    this.gaussianWeights = null;
  }
}
