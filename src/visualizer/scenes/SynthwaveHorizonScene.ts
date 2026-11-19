import * as THREE from 'three';
import { VisualizerScene } from './SceneBase';
import { AudioMetrics } from '../../audio/types';
import { ColorPalette } from '../presets';
import { useVisualizerStore } from '../../store/visualizerStore';

export class SynthwaveHorizonScene implements VisualizerScene {
  public id = 'synthwave-horizon';
  public name = '03 // SYNTHWAVE HORIZON';

  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;

  // Ground Grid & Central Highway
  private gridMesh: THREE.Mesh | null = null;
  private gridGeo: THREE.PlaneGeometry | null = null;
  private gridMat: THREE.MeshStandardMaterial | null = null;
  private originalGridY: Float32Array | null = null;
  private gridOffsetZ = 0;
  private readonly gridWidth = 75;
  private readonly gridLength = 150;
  private readonly gridSegsX = 44;
  private readonly gridSegsZ = 75;

  // Central Laser Highway Line
  private highwayLines: THREE.LineSegments | null = null;
  private highwayGeo: THREE.BufferGeometry | null = null;
  private highwayMat: THREE.LineBasicMaterial | null = null;

  // Volumetric Layered Mountain Ranges (Solid Base + Wireframe Edge Crest)
  private leftSolidMountains: THREE.Mesh | null = null;
  private rightSolidMountains: THREE.Mesh | null = null;
  private leftWireMountains: THREE.Mesh | null = null;
  private rightWireMountains: THREE.Mesh | null = null;
  private mountainGeo: THREE.PlaneGeometry | null = null;
  private originalMountainY: Float32Array | null = null;
  private mountainSolidMat: THREE.MeshStandardMaterial | null = null;
  private mountainWireMat: THREE.MeshBasicMaterial | null = null;

  // Segmented 1980s Horizon Sun & Corona
  private sunGroup = new THREE.Group();
  private sunCoronaMesh: THREE.Mesh | null = null;
  private sunSlices: THREE.Mesh[] = [];

  // Celestial Starfield & Distant Nebula Haze
  private starfieldMesh: THREE.Points | null = null;
  private starfieldGeo: THREE.BufferGeometry | null = null;

  // Lighting
  private horizonLight: THREE.PointLight | null = null;
  private ambientLight: THREE.AmbientLight | null = null;

  // Camera & Hover Dynamics
  private readonly baseFov = 65;
  private hoverY = 3.2;

  public init(scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
    this.scene = scene;
    this.camera = camera;

    this.camera.position.set(0, this.hoverY, 12);
    this.camera.lookAt(0, 4.5, -90);
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();

    // Deep synthwave atmospheric fog
    scene.fog = new THREE.FogExp2(0x0a0414, 0.015);

    // Setup Lighting
    this.ambientLight = new THREE.AmbientLight(0x24083d, 1.4);
    scene.add(this.ambientLight);

    this.horizonLight = new THREE.PointLight(0xffaa00, 5.5, 160);
    this.horizonLight.position.set(0, 15, -115);
    scene.add(this.horizonLight);

    // Build Scene Elements
    this.setupGrid();
    this.setupHighway();
    this.setupMountains();
    this.setupSun();
    this.setupStarfield();
  }

  private setupGrid(): void {
    if (!this.scene) return;

    this.gridGeo = new THREE.PlaneGeometry(
      this.gridWidth,
      this.gridLength,
      this.gridSegsX,
      this.gridSegsZ
    );
    this.gridGeo.rotateX(-Math.PI / 2);
    this.gridGeo.translate(0, 0, -this.gridLength / 2 + 12);

    const posAttr = this.gridGeo.attributes.position;
    this.originalGridY = new Float32Array(posAttr.count);
    for (let i = 0; i < posAttr.count; i++) {
      this.originalGridY[i] = posAttr.getY(i);
    }

    this.gridMat = new THREE.MeshStandardMaterial({
      color: 0xff007f,
      wireframe: true,
      emissive: 0x8b00ff,
      emissiveIntensity: 0.85,
      roughness: 0.4,
      metalness: 0.6
    });

    this.gridMesh = new THREE.Mesh(this.gridGeo, this.gridMat);
    this.scene.add(this.gridMesh);
  }

  private setupHighway(): void {
    if (!this.scene) return;

    const segmentsCount = 40;
    const highwayPositions = new Float32Array(segmentsCount * 2 * 3);
    const segLength = 2.4;
    const gap = 1.4;

    for (let i = 0; i < segmentsCount; i++) {
      const zStart = 10 - i * (segLength + gap);
      const zEnd = zStart - segLength;

      highwayPositions[i * 6] = 0;
      highwayPositions[i * 6 + 1] = 0.05;
      highwayPositions[i * 6 + 2] = zStart;

      highwayPositions[i * 6 + 3] = 0;
      highwayPositions[i * 6 + 4] = 0.05;
      highwayPositions[i * 6 + 5] = zEnd;
    }

    this.highwayGeo = new THREE.BufferGeometry();
    this.highwayGeo.setAttribute('position', new THREE.BufferAttribute(highwayPositions, 3));

    this.highwayMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      linewidth: 2,
      transparent: true,
      opacity: 0.9
    });

    this.highwayLines = new THREE.LineSegments(this.highwayGeo, this.highwayMat);
    this.scene.add(this.highwayLines);
  }

  private setupMountains(): void {
    if (!this.scene) return;

    const mWidth = 45;
    const mLength = 140;
    const segsX = 26;
    const segsZ = 55;

    this.mountainGeo = new THREE.PlaneGeometry(mWidth, mLength, segsX, segsZ);
    this.mountainGeo.rotateX(-Math.PI / 2);

    const pos = this.mountainGeo.attributes.position;
    this.originalMountainY = new Float32Array(pos.count);

    // Procedural multi-frequency mountain crests
    for (let i = 0; i < pos.count; i++) {
      const u = (pos.getX(i) / mWidth) + 0.5; // 0 to 1
      const v = (pos.getZ(i) / mLength) + 0.5;

      // Higher peaks on outer edges
      const edgeFactor = Math.pow(u, 1.4);
      const harmonic1 = Math.sin(v * 16.0) * Math.cos(u * 12.0);
      const harmonic2 = Math.sin(v * 32.0 + u * 8.0) * 0.4;
      const height = Math.max(0, edgeFactor * 14.0 + harmonic1 * 3.5 + harmonic2 * 1.5);

      pos.setY(i, height);
      this.originalMountainY[i] = height;
    }
    this.mountainGeo.computeVertexNormals();

    // Solid dark obsidian material
    this.mountainSolidMat = new THREE.MeshStandardMaterial({
      color: 0x07040d,
      roughness: 0.85,
      metalness: 0.3,
      flatShading: true
    });

    // Wireframe glowing edge crests
    this.mountainWireMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.7
    });

    // Left Mountains
    this.leftSolidMountains = new THREE.Mesh(this.mountainGeo, this.mountainSolidMat);
    this.leftSolidMountains.position.set(-this.gridWidth / 2 - 12, 0, -mLength / 2 + 10);
    this.scene.add(this.leftSolidMountains);

    this.leftWireMountains = new THREE.Mesh(this.mountainGeo, this.mountainWireMat);
    this.leftWireMountains.position.copy(this.leftSolidMountains.position);
    this.leftWireMountains.position.y += 0.04;
    this.scene.add(this.leftWireMountains);

    // Right Mountains (mirrored in X)
    this.rightSolidMountains = new THREE.Mesh(this.mountainGeo, this.mountainSolidMat);
    this.rightSolidMountains.scale.set(-1, 1, 1);
    this.rightSolidMountains.position.set(this.gridWidth / 2 + 12, 0, -mLength / 2 + 10);
    this.scene.add(this.rightSolidMountains);

    this.rightWireMountains = new THREE.Mesh(this.mountainGeo, this.mountainWireMat);
    this.rightWireMountains.scale.set(-1, 1, 1);
    this.rightWireMountains.position.copy(this.rightSolidMountains.position);
    this.rightWireMountains.position.y += 0.04;
    this.scene.add(this.rightWireMountains);
  }

  private setupSun(): void {
    if (!this.scene) return;

    const sunRadius = 15.0;
    const slices = 10;
    const sunZ = -125;
    const sunBaseY = 15;

    // Atmospheric Back-Corona Disc
    const coronaGeo = new THREE.CircleGeometry(sunRadius * 1.35, 64);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xff007f,
      transparent: true,
      opacity: 0.28
    });
    this.sunCoronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    this.sunCoronaMesh.position.set(0, sunBaseY, sunZ - 1.0);
    this.sunGroup.add(this.sunCoronaMesh);

    // Gradient horizontal slat slices
    const sunColors = [
      0xffea00, // Golden Yellow
      0xffcc00,
      0xffaa00, // Amber
      0xff8800,
      0xff5500, // Orange
      0xff2200,
      0xff0066, // Hot Pink
      0xff007f, // Neon Magenta
      0xd9006c,
      0xaa0055  // Deep Base
    ];

    for (let i = 0; i < slices; i++) {
      const sliceHeight = 1.35 - (i * 0.05);
      const gap = 0.22 + (i * 0.12);
      const yOffset = sunBaseY + (slices / 2 - i) * (sliceHeight + gap);

      const dy = yOffset - sunBaseY;
      if (Math.abs(dy) >= sunRadius) continue;
      const sliceWidth = Math.sqrt(sunRadius * sunRadius - dy * dy) * 2;

      const geom = new THREE.PlaneGeometry(sliceWidth, sliceHeight);
      const mat = new THREE.MeshBasicMaterial({
        color: sunColors[i % sunColors.length],
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(0, yOffset, sunZ);
      this.sunGroup.add(mesh);
      this.sunSlices.push(mesh);
    }

    this.scene.add(this.sunGroup);
  }

  private setupStarfield(): void {
    if (!this.scene) return;

    const starCount = 1100;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const cWhite = new THREE.Color(0xffffff);
    const cAmber = new THREE.Color(0xffaa00);
    const cCyan = new THREE.Color(0x00f0ff);

    for (let i = 0; i < starCount; i++) {
      // Upper celestial dome
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * (Math.PI / 2.2);
      const r = 135 + Math.random() * 20;

      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.max(3.0, r * Math.cos(phi));
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 30;

      const pick = Math.random();
      const col = pick < 0.6 ? cWhite : pick < 0.85 ? cCyan : cAmber;
      starColors[i * 3] = col.r;
      starColors[i * 3 + 1] = col.g;
      starColors[i * 3 + 2] = col.b;
    }

    this.starfieldGeo = new THREE.BufferGeometry();
    this.starfieldGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    this.starfieldGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });

    this.starfieldMesh = new THREE.Points(this.starfieldGeo, starMat);
    this.scene.add(this.starfieldMesh);
  }

  public update(elapsedTime: number, deltaTime: number, metrics: AudioMetrics): void {
    const store = useVisualizerStore.getState();
    const isPlaying = metrics.overall > 0.01;
    const speedMult = store.motionSpeed * (isPlaying ? 1.0 + metrics.mid * 0.75 : 0.28);
    const beatPulse = (typeof metrics.beatPulse === 'number') ? metrics.beatPulse : 0;
    const bassPulse = beatPulse * store.bassSensitivity;
    const shakeMult = store.cameraShake ? store.cameraShakeIntensity : 0.0;

    // 1. Endless Ground Grid Forward Flow with Audio Wave Ripples
    const flowStep = deltaTime * 20.0 * speedMult;
    this.gridOffsetZ = (this.gridOffsetZ + flowStep) % (this.gridLength / this.gridSegsZ);

    if (this.gridMesh && this.gridGeo && this.originalGridY) {
      this.gridMesh.position.z = this.gridOffsetZ;

      const posAttr = this.gridGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const z = posAttr.getZ(i);
        const wave = Math.sin(z * 0.14 - elapsedTime * 4.0 + x * 0.08) * metrics.mid * 0.35;
        posAttr.setY(i, this.originalGridY[i] + wave);
      }
      posAttr.needsUpdate = true;
    }

    // 2. Animate Highway Dash Markings
    if (this.highwayLines && this.highwayGeo) {
      const posAttr = this.highwayGeo.attributes.position;
      const positions = posAttr.array as Float32Array;
      const segLength = 2.4;
      const gap = 1.4;
      const period = segLength + gap;

      for (let i = 0; i < 40; i++) {
        let z1 = positions[i * 6 + 2] + flowStep * 1.2;
        let z2 = positions[i * 6 + 5] + flowStep * 1.2;

        if (z1 > 10) {
          z1 -= 40 * period;
          z2 -= 40 * period;
        }

        positions[i * 6 + 2] = z1;
        positions[i * 6 + 5] = z2;
      }
      posAttr.needsUpdate = true;
    }

    // 3. Mountains Dynamic Peak Surging on Bass
    if (this.mountainGeo && this.originalMountainY) {
      const posAttr = this.mountainGeo.attributes.position;
      const surge = 1.0 + bassPulse * 0.45 + metrics.bass * 0.25;

      for (let i = 0; i < posAttr.count; i++) {
        posAttr.setY(i, this.originalMountainY[i] * surge);
      }
      posAttr.needsUpdate = true;
      this.mountainGeo.computeVertexNormals();
    }

    // 4. Sun Gravitational Bounce & Corona Flare
    if (this.sunGroup) {
      const sunBounce = Math.sin(elapsedTime * 1.4) * 0.4 + bassPulse * 1.8;
      this.sunGroup.position.y = sunBounce;

      if (this.sunCoronaMesh) {
        const cScale = 1.0 + bassPulse * 0.25 + metrics.treble * 0.15;
        this.sunCoronaMesh.scale.set(cScale, cScale, 1.0);
      }
    }
    if (this.horizonLight) {
      this.horizonLight.intensity = 5.0 + bassPulse * 6.5 + metrics.treble * 2.5;
    }

    // 5. Cinematic Hover Camera
    if (this.camera) {
      const targetHover = this.hoverY + Math.sin(elapsedTime * 0.7) * 0.25 + bassPulse * 0.4;
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetHover, 0.08);

      const swayX = Math.sin(elapsedTime * 0.35) * 0.6;
      const shakeX = (Math.random() - 0.5) * 0.08 * bassPulse * shakeMult;
      const shakeY = (Math.random() - 0.5) * 0.08 * bassPulse * shakeMult;

      this.camera.position.x = swayX + shakeX;
      this.camera.position.y += shakeY;

      const targetFov = this.baseFov + bassPulse * 5.0;
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 0.2);
      this.camera.updateProjectionMatrix();
    }
  }

  public applyPalette(palette: ColorPalette): void {
    if (this.scene?.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.setHex(palette.bgHex);
    }
    if (this.gridMat) {
      this.gridMat.color.setHex(palette.secondaryHex);
      this.gridMat.emissive.setHex(palette.primaryHex);
    }
    if (this.highwayMat) {
      this.highwayMat.color.setHex(palette.primaryHex);
    }
    if (this.mountainWireMat) {
      this.mountainWireMat.color.setHex(palette.primaryHex);
    }
    if (this.horizonLight) {
      this.horizonLight.color.setHex(palette.accentHex);
    }
    if (this.sunCoronaMesh) {
      (this.sunCoronaMesh.material as THREE.MeshBasicMaterial).color.setHex(palette.secondaryHex);
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
      if (this.gridMesh) this.scene.remove(this.gridMesh);
      if (this.highwayLines) this.scene.remove(this.highwayLines);
      if (this.leftSolidMountains) this.scene.remove(this.leftSolidMountains);
      if (this.rightSolidMountains) this.scene.remove(this.rightSolidMountains);
      if (this.leftWireMountains) this.scene.remove(this.leftWireMountains);
      if (this.rightWireMountains) this.scene.remove(this.rightWireMountains);
      if (this.sunGroup) this.scene.remove(this.sunGroup);
      if (this.starfieldMesh) this.scene.remove(this.starfieldMesh);
      if (this.ambientLight) this.scene.remove(this.ambientLight);
      if (this.horizonLight) this.scene.remove(this.horizonLight);
    }

    this.gridGeo?.dispose();
    this.highwayGeo?.dispose();
    this.mountainGeo?.dispose();
    this.starfieldGeo?.dispose();

    this.gridMat?.dispose();
    this.highwayMat?.dispose();
    this.mountainSolidMat?.dispose();
    this.mountainWireMat?.dispose();

    if (this.sunCoronaMesh) {
      (this.sunCoronaMesh.geometry as THREE.BufferGeometry).dispose();
      (this.sunCoronaMesh.material as THREE.Material).dispose();
    }
    for (const slice of this.sunSlices) {
      slice.geometry.dispose();
      (slice.material as THREE.Material).dispose();
    }
    if (this.starfieldMesh) {
      (this.starfieldMesh.material as THREE.Material).dispose();
    }

    this.sunSlices = [];
    this.originalGridY = null;
    this.originalMountainY = null;
  }
}
