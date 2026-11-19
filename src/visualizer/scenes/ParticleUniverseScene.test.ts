import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { ParticleUniverseScene } from './ParticleUniverseScene';
import { AudioMetrics } from '../../audio/types';

describe('ParticleUniverseScene', () => {
  const dummyMetrics: AudioMetrics = {
    bass: 0.85,
    mid: 0.6,
    treble: 0.75,
    rawBass: 0.9,
    rawMid: 0.6,
    rawTreble: 0.8,
    overall: 0.7,
    frequencyData: new Uint8Array(512),
    waveform: new Uint8Array(512).fill(128)
  };

  it('instantiates with proper metadata', () => {
    const scene = new ParticleUniverseScene();
    expect(scene.id).toBe('particle-universe');
    expect(scene.name).toContain('CELESTIAL NEBULA');
  });

  it('initializes particle constellation and pulsar core inside Three.js scene', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const nebula = new ParticleUniverseScene();

    nebula.init(threeScene, camera);

    expect(threeScene.children.length).toBeGreaterThanOrEqual(3);
    expect(threeScene.fog).toBeDefined();

    nebula.dispose();
  });

  it('executes update loop with shockwave propagation and orbital rotation', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const nebula = new ParticleUniverseScene();

    nebula.init(threeScene, camera);

    expect(() => {
      nebula.update(1.0, 0.016, dummyMetrics);
      nebula.update(2.0, 0.016, dummyMetrics);
    }).not.toThrow();

    nebula.dispose();
  });

  it('handles resize cleanly', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    const nebula = new ParticleUniverseScene();

    nebula.init(threeScene, camera);
    nebula.resize(1920, 1080);

    expect(camera.aspect).toBeCloseTo(1920 / 1080);
    nebula.dispose();
  });

  it('disposes resources cleanly without memory leaks', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const nebula = new ParticleUniverseScene();

    nebula.init(threeScene, camera);
    nebula.dispose();

    expect(threeScene.children.length).toBe(0);
  });
});
