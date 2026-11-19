import { describe, it, expect } from 'vitest';
import { SceneManager, AVAILABLE_SCENES } from './SceneManager';

describe('SceneManager', () => {
  it('registers all 6 official scenes', () => {
    expect(AVAILABLE_SCENES).toHaveLength(6);
    const ids = AVAILABLE_SCENES.map((s) => s.id);
    expect(ids).toContain('neon-tunnel');
    expect(ids).toContain('particle-universe');
    expect(ids).toContain('synthwave-horizon');
    expect(ids).toContain('ferrofluid');
    expect(ids).toContain('voxel-matrix');
    expect(ids).toContain('waveform-ridgelines');
  });

  it('creates the corresponding scene instance based on ID', () => {
    const scenes = [
      'neon-tunnel',
      'particle-universe',
      'synthwave-horizon',
      'ferrofluid',
      'voxel-matrix',
      'waveform-ridgelines'
    ];

    for (const id of scenes) {
      const scene = SceneManager.createScene(id);
      expect(scene.id).toBe(id);
    }
  });

  it('falls back to neon-tunnel for unknown scene IDs', () => {
    const fallback = SceneManager.createScene('unknown-scene-id');
    expect(fallback.id).toBe('neon-tunnel');
  });

  it('retrieves scene descriptor by ID', () => {
    const desc = SceneManager.getSceneDescriptor('particle-universe');
    expect(desc.title).toBe('Celestial Nebula');
    expect(desc.shortcut).toBe('2');

    const desc4 = SceneManager.getSceneDescriptor('ferrofluid');
    expect(desc4.title).toBe('Ferrofluid Singularity');
    expect(desc4.shortcut).toBe('4');
  });
});
