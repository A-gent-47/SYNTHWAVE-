import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { PlasmaVortexScene } from './PlasmaVortexScene';
import { AudioMetrics } from '../../audio/types';
import { COLOR_PALETTES } from '../presets';

describe('PlasmaVortexScene', () => {
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
    const scene = new PlasmaVortexScene();
    expect(scene.id).toBe('plasma-vortex');
    expect(scene.name).toContain('PLASMA VORTEX');
  });

  it('initializes vortex rings, particles, core and lights in Three.js scene', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const vortex = new PlasmaVortexScene();

    vortex.init(threeScene, camera);

    expect(threeScene.children.length).toBeGreaterThanOrEqual(4);
    expect(threeScene.fog).toBeDefined();

    vortex.dispose();
  });

  it('executes update loop smoothly with audio metrics', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const vortex = new PlasmaVortexScene();

    vortex.init(threeScene, camera);

    expect(() => {
      vortex.update(1.0, 0.016, dummyMetrics);
      vortex.update(1.5, 0.016, dummyMetrics);
    }).not.toThrow();

    expect(camera.fov).toBeGreaterThan(0);
    expect(isNaN(camera.fov)).toBe(false);

    vortex.dispose();
  });

  it('applies color palettes cleanly', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const vortex = new PlasmaVortexScene();

    vortex.init(threeScene, camera);
    expect(() => {
      vortex.applyPalette(COLOR_PALETTES['retro-sunset']);
      vortex.applyPalette(COLOR_PALETTES['monochrome']);
    }).not.toThrow();

    vortex.dispose();
  });

  it('handles resize cleanly', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    const vortex = new PlasmaVortexScene();

    vortex.init(threeScene, camera);
    vortex.resize(1920, 1080);

    expect(camera.aspect).toBeCloseTo(1920 / 1080);
    vortex.dispose();
  });

  it('disposes resources and clears scene hierarchy cleanly', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const vortex = new PlasmaVortexScene();

    vortex.init(threeScene, camera);
    vortex.dispose();

    expect(threeScene.children.length).toBe(0);
  });
});
