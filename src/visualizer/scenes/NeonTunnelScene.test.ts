import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { NeonTunnelScene } from './NeonTunnelScene';
import { AudioMetrics } from '../../audio/types';

describe('NeonTunnelScene', () => {
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
    const scene = new NeonTunnelScene();
    expect(scene.id).toBe('neon-tunnel');
    expect(scene.name).toContain('NEON TUNNEL');
  });

  it('initializes 3D objects and lighting inside Three.js scene', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const tunnel = new NeonTunnelScene();

    tunnel.init(threeScene, camera);

    // Verify children added (ambient light, tunnel point light, rings group, particle mesh)
    expect(threeScene.children.length).toBeGreaterThanOrEqual(3);
    expect(threeScene.fog).toBeDefined();

    tunnel.dispose();
  });

  it('executes update loop and procedural ring recycling smoothly', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const tunnel = new NeonTunnelScene();

    tunnel.init(threeScene, camera);

    // Run frame updates
    expect(() => {
      tunnel.update(1.0, 0.016, dummyMetrics);
      tunnel.update(1.5, 0.016, dummyMetrics);
    }).not.toThrow();

    // Verify camera FOV modulated by bass without NaN
    expect(camera.fov).toBeGreaterThan(60);
    expect(isNaN(camera.fov)).toBe(false);

    tunnel.dispose();
  });

  it('handles resize cleanly', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    const tunnel = new NeonTunnelScene();

    tunnel.init(threeScene, camera);
    tunnel.resize(1920, 1080);

    expect(camera.aspect).toBeCloseTo(1920 / 1080);
    tunnel.dispose();
  });

  it('disposes resources and clears scene hierarchy without memory leaks', () => {
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    const tunnel = new NeonTunnelScene();

    tunnel.init(threeScene, camera);
    tunnel.dispose();

    // Verify scene children removed
    expect(threeScene.children.length).toBe(0);
  });
});
