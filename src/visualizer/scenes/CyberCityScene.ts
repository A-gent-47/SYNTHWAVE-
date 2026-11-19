import * as THREE from 'three';
import { VisualizerScene } from './SceneBase';
import { AudioMetrics } from '../../audio/types';
import { ColorPalette } from '../presets';
import { useVisualizerStore } from '../../store/visualizerStore';

const BUILDING_COUNT = 64;
const ROAD_WIDTH = 12;
const STAR_COUNT = 1200;

interface Building {
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  baseHeight: number;
  laneX: number;
  laneZ: number;
  bandIdx: number; // 0=bass, 1=mid, 2=treble
}

export class CyberCityScene implements VisualizerScene {
  public id = 'cyber-city';
  public name = '05 // CYBER CITY';

  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private readonly baseFov = 72;

  // Buildings
  private buildingGroup = new THREE.Group();
  private buildings: Building[] = [];

  // Road / grid floor
  private floorMesh: THREE.Mesh | null = null;
  private gridHelper: THREE.GridHelper | null = null;

  // Stars
  private starsMesh: THREE.Points | null = null;

  // Horizon glow
  private sunMesh: THREE.Mesh | null = null;
  private sunSlices: THREE.Mesh[] = [];

  // Lights
  private ambientLight: THREE.AmbientLight | null = null;
  private streetLight1: THREE.PointLight | null = null;
  private streetLight2: THREE.PointLight | null = null;
  private skyLight: THREE.DirectionalLight | null = null;

  // Neon sign lines on buildings (per building)
  private neonLines: THREE.LineSegments[] = [];

  // Camera tracking
  private cameraZ = 0;

  public init(scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
    this.scene = scene;
    this.camera = camera;
    this.camera.position.set(0, 4, 30);
    this.camera.fov = this.baseFov;
    this.camera.lookAt(0, 6, 0);
    this.camera.updateProjectionMatrix();

    scene.fog = new THREE.FogExp2(0x040208, 0.022);

    // Lights
    this.ambientLight = new THREE.AmbientLight(0x111122, 0.8);
    scene.add(this.ambientLight);

    this.skyLight = new THREE.DirectionalLight(0x4400aa, 0.5);
    this.skyLight.position.set(0, 30, -10);
    scene.add(this.skyLight);

    this.streetLight1 = new THREE.PointLight(0x00f0ff, 5, 40);
    this.streetLight1.position.set(-ROAD_WIDTH / 2 - 2, 6, 10);
    scene.add(this.streetLight1);

    this.streetLight2 = new THREE.PointLight(0xff007f, 5, 40);
    this.streetLight2.position.set(ROAD_WIDTH / 2 + 2, 6, 10);
    scene.add(this.streetLight2);

    this.buildBuildings();
    scene.add(this.buildingGroup);

    this.buildFloor();
    this.buildHorizon();
    this.buildStars();
  }

  private buildBuildings(): void {
    const buildingGeo = new THREE.BoxGeometry(1, 1, 1);

    const leftPositions = this.generateBuildingPositions(-1);
    const rightPositions = this.generateBuildingPositions(1);
    const allPositions = [...leftPositions, ...rightPositions];

    for (let i = 0; i < allPositions.length; i++) {
      const { x, z, width, depth, height, band } = allPositions[i];

      const mat = new THREE.MeshStandardMaterial({
        color: 0x0d0d1a,
        emissive: band === 0 ? 0x00f0ff : band === 1 ? 0xff007f : 0xffb700,
        emissiveIntensity: 0.08,
        roughness: 0.7,
        metalness: 0.6,
      });

      const mesh = new THREE.Mesh(buildingGeo, mat);
      mesh.scale.set(width, height, depth);
      mesh.position.set(x, height / 2, z);

      this.buildings.push({
        mesh,
        material: mat,
        baseHeight: height,
        laneX: x,
        laneZ: z,
        bandIdx: band,
      });
      this.buildingGroup.add(mesh);

      // Add neon window lines to each building
      this.addNeonWindows(mesh, width, height, depth, band);
    }
  }

  private generateBuildingPositions(side: number): Array<{
    x: number; z: number; width: number; depth: number; height: number; band: number;
  }> {
    const positions = [];
    const startX = side * (ROAD_WIDTH / 2 + 2);
    const buildingRows = BUILDING_COUNT / 2;

    for (let i = 0; i < buildingRows; i++) {
      const z = 60 - i * 6.5;
      const col = Math.floor(i / 8);
      const x = startX + side * (col * 0.7 * (Math.random() * 0.3 + 0.85));
      const height = 5 + Math.random() * 25;
      const width = 2.5 + Math.random() * 2.5;
      const depth = 2.5 + Math.random() * 2.5;
      const band = i % 3;
      positions.push({ x, z, width, depth, height, band });
    }
    return positions;
  }

  private addNeonWindows(
    building: THREE.Mesh,
    width: number,
    height: number,
    depth: number,
    band: number
  ): void {
    const rows = Math.floor(height / 2.5);
    const windowColor = band === 0 ? 0x00f0ff : band === 1 ? 0xff007f : 0xffb700;

    const segments: number[] = [];
    for (let row = 0; row < rows; row++) {
      if (Math.random() < 0.5) continue; // Skip random rows
      const y = (row / rows - 0.5) * height * 0.85;
      // Horizontal line across front face
      const hw = width * 0.45;
      segments.push(-hw, y, depth * 0.501, hw, y, depth * 0.501);
    }

    if (segments.length === 0) return;

    const geo = new THREE.BufferGeometry();
    const posArr = new Float32Array(segments);
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));

    const mat = new THREE.LineBasicMaterial({
      color: windowColor,
      transparent: true,
      opacity: 0.6,
    });

    const lines = new THREE.LineSegments(geo, mat);
    building.add(lines);
    this.neonLines.push(lines);
  }

  private buildFloor(): void {
    if (!this.scene) return;

    // Dark road surface
    const floorGeo = new THREE.PlaneGeometry(60, 200);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x070710,
      roughness: 0.9,
      metalness: 0.1,
    });
    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.set(0, 0, -60);
    this.scene.add(this.floorMesh);

    // Neon grid overlay
    this.gridHelper = new THREE.GridHelper(200, 40, 0x00f0ff, 0x220033);
    this.gridHelper.position.set(0, 0.02, -60);
    this.scene.add(this.gridHelper);
  }

  private buildHorizon(): void {
    if (!this.scene) return;

    // Sunset/horizon circle
    const sunGeo = new THREE.CircleGeometry(8, 64);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0.9,
    });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunMesh.position.set(0, 12, -90);
    this.scene.add(this.sunMesh);

    // Horizontal slices through the sun (retro aesthetic)
    const sliceColors = [0xff0040, 0xff0066, 0xff0080, 0xdd0080, 0xbb0088];
    for (let i = 0; i < 5; i++) {
      const sliceGeo = new THREE.PlaneGeometry(16.5, 0.4);
      const sliceMat = new THREE.MeshBasicMaterial({
        color: sliceColors[i],
        transparent: true,
        opacity: 0.9,
      });
      const slice = new THREE.Mesh(sliceGeo, sliceMat);
      slice.position.set(0, 8 - i * 2.0, -89.5);
      this.scene.add(slice);
      this.sunSlices.push(slice);
    }
  }

  private buildStars(): void {
    if (!this.scene) return;

    const starPositions = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 200;
      starPositions[i * 3 + 1] = 20 + Math.random() * 80;
      starPositions[i * 3 + 2] = -Math.random() * 150 - 10;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.25,
      transparent: true,
      opacity: 0.75,
      sizeAttenuation: true,
    });

    this.starsMesh = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starsMesh);
  }

  public update(elapsedTime: number, deltaTime: number, metrics: AudioMetrics): void {
    if (!this.camera) return;

    const pulse = metrics.beatPulse ?? 0;
    const isPlaying = metrics.isPlaying ?? (metrics.overall > 0.02);
    const { cameraShake, cameraShakeIntensity } = useVisualizerStore.getState();
    const shakeMult = cameraShake ? cameraShakeIntensity : 0.0;

    // 1. Forward camera drive through the city
    const driveSpeed = isPlaying
      ? 8 + metrics.overall * 14 + pulse * 10
      : 2.5;
    this.cameraZ -= driveSpeed * deltaTime;

    this.camera.position.z = 30 + this.cameraZ;
    this.camera.position.y = 4 + Math.sin(elapsedTime * 0.6) * 0.5;
    this.camera.position.x = Math.sin(elapsedTime * 0.25) * 1.5 * shakeMult + metrics.rawBass * 0.4 * Math.sin(elapsedTime * 4) * shakeMult;

    this.camera.lookAt(
      this.camera.position.x * 0.3,
      8 + metrics.bass * 2,
      this.camera.position.z - 30
    );

    const targetFov = this.baseFov + metrics.bass * 8 + pulse * 10;
    this.camera.fov += (targetFov - this.camera.fov) * 0.35;
    this.camera.updateProjectionMatrix();

    // 2. Building height reactivity — pulse with band energy
    const bandMetrics = [metrics.bass, metrics.mid, metrics.treble];
    for (let i = 0; i < this.buildings.length; i++) {
      const b = this.buildings[i];
      const band = bandMetrics[b.bandIdx];

      // Procedurally recycle buildings that are behind the camera
      const worldZ = b.laneZ + this.cameraZ;
      if (worldZ > this.camera.position.z + 10) {
        b.laneZ -= 200;
      }

      const heightMult = 1.0 + band * 0.6 + pulse * 0.5;
      const newHeight = b.baseHeight * heightMult;
      b.mesh.scale.y = newHeight;
      b.mesh.position.y = newHeight / 2;
      b.mesh.position.z = b.laneZ + this.cameraZ;

      // Emissive pulse on windows
      b.material.emissiveIntensity = 0.06 + band * 0.55 + pulse * 0.6;
    }

    // 3. Neon window flicker
    for (let i = 0; i < this.neonLines.length; i++) {
      const mat = this.neonLines[i].material as THREE.LineBasicMaterial;
      const band = bandMetrics[i % 3];
      mat.opacity = 0.3 + band * 0.55 + pulse * 0.25;
    }

    // 4. Street lights pulse
    if (this.streetLight1) {
      this.streetLight1.intensity = 4 + metrics.bass * 12 + pulse * 15;
      this.streetLight1.position.z = this.camera.position.z - 5;
    }
    if (this.streetLight2) {
      this.streetLight2.intensity = 4 + metrics.treble * 10 + pulse * 12;
      this.streetLight2.position.z = this.camera.position.z - 5;
    }

    // 5. Sun glow breathe
    if (this.sunMesh) {
      const sunScale = 1.0 + metrics.bass * 0.15 + pulse * 0.12;
      this.sunMesh.scale.setScalar(sunScale);
    }

    // 6. Star twinkle
    if (this.starsMesh) {
      const starMat = this.starsMesh.material as THREE.PointsMaterial;
      starMat.opacity = 0.5 + metrics.treble * 0.35;
    }
  }

  public applyPalette(palette: ColorPalette): void {
    if (this.scene?.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.setHex(palette.bgHex);
    }
    if (this.streetLight1) this.streetLight1.color.setHex(palette.primaryHex);
    if (this.streetLight2) this.streetLight2.color.setHex(palette.secondaryHex);

    for (let i = 0; i < this.buildings.length; i++) {
      const emissiveHex = this.buildings[i].bandIdx === 0
        ? palette.primaryHex
        : this.buildings[i].bandIdx === 1
          ? palette.secondaryHex
          : palette.accentHex;
      this.buildings[i].material.emissive.setHex(emissiveHex);
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
      this.scene.remove(this.buildingGroup);
      if (this.floorMesh) this.scene.remove(this.floorMesh);
      if (this.gridHelper) this.scene.remove(this.gridHelper);
      if (this.starsMesh) this.scene.remove(this.starsMesh);
      if (this.sunMesh) this.scene.remove(this.sunMesh);
      if (this.ambientLight) this.scene.remove(this.ambientLight);
      if (this.streetLight1) this.scene.remove(this.streetLight1);
      if (this.streetLight2) this.scene.remove(this.streetLight2);
      if (this.skyLight) this.scene.remove(this.skyLight);
      for (const slice of this.sunSlices) this.scene.remove(slice);
    }

    for (const b of this.buildings) {
      b.material.dispose();
    }

    if (this.starsMesh) {
      (this.starsMesh.geometry as THREE.BufferGeometry).dispose();
      (this.starsMesh.material as THREE.Material).dispose();
    }

    this.buildings = [];
    this.neonLines = [];
    this.sunSlices = [];
  }
}
