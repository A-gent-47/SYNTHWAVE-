import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { SynthwaveHorizonScene } from './SynthwaveHorizonScene';
import { AudioMetrics } from '../../audio/types';

describe('SynthwaveHorizonScene', () => {
  const dummyMetrics: AudioMetrics = {
    bass: 0.9,
    mid: 0.55,
    treble: 0.7,
    rawBass: 0.95,
    rawMid: 0.6,
    rawTreble: 0.8,
    overall: 0.75,
    frequencyData: new Uint8Array(512),
    waveform: new Uint8Array(512).fill(128)
  };

  it('instantiates with proper metadata', () => {
    const scene = new SynthwaveHorizonScene();
    expect(scene.id).toBe('synthwave-horizon');
    expect(scene.name).toContain('SYNTHWAVE HORIZON');
  });

  it('initializes ground grid, segmented sun, mountains, and starfield', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const horizon = new SynthwaveHorizonScene();

    horizon.init(threeScene, camera);

    // Grid, sun, left mountain, right mountain, starfield, lights
    expect(threeScene.children.length).toBeGreaterThanOrEqual(5);
    expect(threeScene.fog).toBeDefined();

    horizon.dispose();
  });

  it('executes update loop modulating mountain volatility and ground grid flow', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const horizon = new SynthwaveHorizonScene();

    horizon.init(threeScene, camera);

    expect(() => {
      horizon.update(1.0, 0.016, dummyMetrics);
      horizon.update(2.0, 0.016, dummyMetrics);
    }).not.toThrow();

    horizon.dispose();
  });

  it('handles resize cleanly', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    const horizon = new SynthwaveHorizonScene();

    horizon.init(threeScene, camera);
    horizon.resize(1920, 1080);

    expect(camera.aspect).toBeCloseTo(1920 / 1080);
    horizon.dispose();
  });

  it('disposes resources cleanly without memory leaks', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const horizon = new SynthwaveHorizonScene();

    horizon.init(threeScene, camera);
    horizon.dispose();

    expect(threeScene.children.length).toBe(0);
  });
});
