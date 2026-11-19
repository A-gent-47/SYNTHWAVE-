import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { FerrofluidScene } from './FerrofluidScene';
import { AudioMetrics } from '../../audio/types';
import { COLOR_PALETTES } from '../presets';

describe('FerrofluidScene', () => {
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
    const scene = new FerrofluidScene();
    expect(scene.id).toBe('ferrofluid');
    expect(scene.name).toContain('FERROFLUID');
  });

  it('initializes metallic core, spectrum halo, waveform ribbon and lighting', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const ferro = new FerrofluidScene();

    ferro.init(threeScene, camera);

    expect(threeScene.children.length).toBeGreaterThanOrEqual(4);
    expect(threeScene.fog).toBeDefined();

    ferro.dispose();
  });

  it('executes update loop and vertex displacement smoothly', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const ferro = new FerrofluidScene();

    ferro.init(threeScene, camera);

    expect(() => {
      ferro.update(1.0, 0.016, dummyMetrics);
      ferro.update(1.5, 0.016, dummyMetrics);
    }).not.toThrow();

    expect(camera.fov).toBeGreaterThan(0);
    expect(isNaN(camera.fov)).toBe(false);

    ferro.dispose();
  });

  it('applies color palettes cleanly', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const ferro = new FerrofluidScene();

    ferro.init(threeScene, camera);
    expect(() => {
      ferro.applyPalette(COLOR_PALETTES['deep-space']);
      ferro.applyPalette(COLOR_PALETTES['cyberpunk']);
    }).not.toThrow();

    ferro.dispose();
  });

  it('handles resize cleanly', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    const ferro = new FerrofluidScene();

    ferro.init(threeScene, camera);
    ferro.resize(1920, 1080);

    expect(camera.aspect).toBeCloseTo(1920 / 1080);
    ferro.dispose();
  });

  it('disposes resources and clears scene hierarchy cleanly', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const ferro = new FerrofluidScene();

    ferro.init(threeScene, camera);
    ferro.dispose();

    expect(threeScene.children.length).toBe(0);
  });
});
