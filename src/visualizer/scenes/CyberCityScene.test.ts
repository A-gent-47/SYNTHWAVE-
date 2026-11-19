import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { CyberCityScene } from './CyberCityScene';
import { AudioMetrics } from '../../audio/types';
import { COLOR_PALETTES } from '../presets';

describe('CyberCityScene', () => {
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
    const scene = new CyberCityScene();
    expect(scene.id).toBe('cyber-city');
    expect(scene.name).toContain('CYBER CITY');
  });

  it('initializes buildings, road grid, sunset and fog in Three.js scene', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const city = new CyberCityScene();

    city.init(threeScene, camera);

    expect(threeScene.children.length).toBeGreaterThanOrEqual(4);
    expect(threeScene.fog).toBeDefined();

    city.dispose();
  });

  it('executes update loop smoothly with audio metrics', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const city = new CyberCityScene();

    city.init(threeScene, camera);

    expect(() => {
      city.update(1.0, 0.016, dummyMetrics);
      city.update(1.5, 0.016, dummyMetrics);
    }).not.toThrow();

    expect(camera.fov).toBeGreaterThan(0);
    expect(isNaN(camera.fov)).toBe(false);

    city.dispose();
  });

  it('applies color palettes cleanly', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const city = new CyberCityScene();

    city.init(threeScene, camera);
    expect(() => {
      city.applyPalette(COLOR_PALETTES['cyberpunk']);
      city.applyPalette(COLOR_PALETTES['electric-violet']);
    }).not.toThrow();

    city.dispose();
  });

  it('handles resize cleanly', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    const city = new CyberCityScene();

    city.init(threeScene, camera);
    city.resize(1920, 1080);

    expect(camera.aspect).toBeCloseTo(1920 / 1080);
    city.dispose();
  });

  it('disposes resources and clears scene hierarchy cleanly', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const city = new CyberCityScene();

    city.init(threeScene, camera);
    city.dispose();

    expect(threeScene.children.length).toBe(0);
  });
});
