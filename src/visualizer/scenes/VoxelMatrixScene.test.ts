import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { VoxelMatrixScene } from './VoxelMatrixScene';
import { AudioMetrics } from '../../audio/types';
import { COLOR_PALETTES } from '../presets';

describe('VoxelMatrixScene', () => {
  const dummyMetrics: AudioMetrics = {
    bass: 0.8,
    mid: 0.5,
    treble: 0.6,
    rawBass: 0.9,
    rawMid: 0.5,
    rawTreble: 0.7,
    overall: 0.65,
    isBeat: true,
    beatPulse: 0.8,
    frequencyData: new Uint8Array(512),
    waveform: new Uint8Array(512).fill(128)
  };

  it('instantiates with proper metadata', () => {
    const scene = new VoxelMatrixScene();
    expect(scene.id).toBe('voxel-matrix');
    expect(scene.name).toContain('VOXEL MATRIX');
  });

  it('initializes instanced voxel grid, platform and lights', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const voxel = new VoxelMatrixScene();

    voxel.init(threeScene, camera);

    expect(threeScene.children.length).toBeGreaterThanOrEqual(4);
    expect(threeScene.fog).toBeDefined();

    voxel.dispose();
  });

  it('executes update loop and pin-art height scaling smoothly', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const voxel = new VoxelMatrixScene();

    voxel.init(threeScene, camera);

    expect(() => {
      voxel.update(1.0, 0.016, dummyMetrics);
      voxel.update(1.5, 0.016, dummyMetrics);
    }).not.toThrow();

    expect(camera.fov).toBeGreaterThan(0);
    expect(isNaN(camera.fov)).toBe(false);

    voxel.dispose();
  });

  it('applies color palettes cleanly', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const voxel = new VoxelMatrixScene();

    voxel.init(threeScene, camera);
    expect(() => {
      voxel.applyPalette(COLOR_PALETTES['cyberpunk']);
      voxel.applyPalette(COLOR_PALETTES['electric-violet']);
    }).not.toThrow();

    voxel.dispose();
  });

  it('handles resize cleanly', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    const voxel = new VoxelMatrixScene();

    voxel.init(threeScene, camera);
    voxel.resize(1920, 1080);

    expect(camera.aspect).toBeCloseTo(1920 / 1080);
    voxel.dispose();
  });

  it('disposes resources and clears scene hierarchy cleanly', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const voxel = new VoxelMatrixScene();

    voxel.init(threeScene, camera);
    voxel.dispose();

    expect(threeScene.children.length).toBe(0);
  });
});
