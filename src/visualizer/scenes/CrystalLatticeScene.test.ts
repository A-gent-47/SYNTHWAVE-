import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { CrystalLatticeScene } from './CrystalLatticeScene';
import { AudioMetrics } from '../../audio/types';
import { COLOR_PALETTES } from '../presets';

describe('CrystalLatticeScene', () => {
  const dummyMetrics: AudioMetrics = {
    bass: 0.8,
    mid: 0.5,
    treble: 0.6,
    rawBass: 0.9,
    rawMid: 0.5,
    rawTreble: 0.7,
    overall: 0.65,
    frequencyData: new Uint8Array(512),
    waveform: new Uint8Array(512).fill(128)
  };

  it('instantiates with proper metadata', () => {
    const scene = new CrystalLatticeScene();
    expect(scene.id).toBe('crystal-lattice');
    expect(scene.name).toContain('CRYSTAL LATTICE');
  });

  it('initializes 3D objects, lighting and fog in Three.js scene', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const lattice = new CrystalLatticeScene();

    lattice.init(threeScene, camera);

    expect(threeScene.children.length).toBeGreaterThanOrEqual(3);
    expect(threeScene.fog).toBeDefined();

    lattice.dispose();
  });

  it('executes update loop smoothly with audio metrics', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const lattice = new CrystalLatticeScene();

    lattice.init(threeScene, camera);

    expect(() => {
      lattice.update(1.0, 0.016, dummyMetrics);
      lattice.update(1.5, 0.016, dummyMetrics);
    }).not.toThrow();

    expect(camera.fov).toBeGreaterThan(0);
    expect(isNaN(camera.fov)).toBe(false);

    lattice.dispose();
  });

  it('applies color palettes cleanly', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const lattice = new CrystalLatticeScene();

    lattice.init(threeScene, camera);
    expect(() => {
      lattice.applyPalette(COLOR_PALETTES['deep-space']);
      lattice.applyPalette(COLOR_PALETTES['retro-sunset']);
    }).not.toThrow();

    lattice.dispose();
  });

  it('handles resize cleanly', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    const lattice = new CrystalLatticeScene();

    lattice.init(threeScene, camera);
    lattice.resize(1920, 1080);

    expect(camera.aspect).toBeCloseTo(1920 / 1080);
    lattice.dispose();
  });

  it('disposes resources and clears scene hierarchy cleanly', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const lattice = new CrystalLatticeScene();

    lattice.init(threeScene, camera);
    lattice.dispose();

    expect(threeScene.children.length).toBe(0);
  });
});
