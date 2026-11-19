import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { WaveformRidgelineScene } from './WaveformRidgelineScene';
import { AudioMetrics } from '../../audio/types';
import { COLOR_PALETTES } from '../presets';

describe('WaveformRidgelineScene', () => {
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
    const scene = new WaveformRidgelineScene();
    expect(scene.id).toBe('waveform-ridgelines');
    expect(scene.name).toContain('RIDGELINES');
  });

  it('initializes ridgelines group, lights and fog', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const ridge = new WaveformRidgelineScene();

    ridge.init(threeScene, camera);

    expect(threeScene.children.length).toBeGreaterThanOrEqual(3);
    expect(threeScene.fog).toBeDefined();

    ridge.dispose();
  });

  it('executes update loop and waterfall progression smoothly', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const ridge = new WaveformRidgelineScene();

    ridge.init(threeScene, camera);

    expect(() => {
      ridge.update(1.0, 0.04, dummyMetrics);
      ridge.update(1.5, 0.04, dummyMetrics);
    }).not.toThrow();

    expect(camera.fov).toBeGreaterThan(0);
    expect(isNaN(camera.fov)).toBe(false);

    ridge.dispose();
  });

  it('applies color palettes cleanly', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const ridge = new WaveformRidgelineScene();

    ridge.init(threeScene, camera);
    expect(() => {
      ridge.applyPalette(COLOR_PALETTES['retro-sunset']);
      ridge.applyPalette(COLOR_PALETTES['deep-space']);
    }).not.toThrow();

    ridge.dispose();
  });

  it('handles resize cleanly', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    const ridge = new WaveformRidgelineScene();

    ridge.init(threeScene, camera);
    ridge.resize(1920, 1080);

    expect(camera.aspect).toBeCloseTo(1920 / 1080);
    ridge.dispose();
  });

  it('disposes resources and clears scene hierarchy cleanly', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const ridge = new WaveformRidgelineScene();

    ridge.init(threeScene, camera);
    ridge.dispose();

    expect(threeScene.children.length).toBe(0);
  });
});
