import { describe, it, expect } from 'vitest';
import {
  BUILT_IN_PRESETS,
  COLOR_PALETTES,
  DEFAULT_PRESET,
  isValidPreset,
  parsePresetsJson,
  PresetConfig
} from './presets';

describe('Presets and Palettes', () => {
  it('includes 8 built-in presets matching system specifications', () => {
    expect(BUILT_IN_PRESETS.length).toBe(8);
    const ids = BUILT_IN_PRESETS.map((p) => p.id);
    expect(ids).toContain('preset-cyberpunk');
    expect(ids).toContain('preset-deep-space');
    expect(ids).toContain('preset-electric-violet');
    expect(ids).toContain('preset-retro-sunset');
    expect(ids).toContain('preset-monochrome');
    expect(ids).toContain('preset-ferrofluid');
    expect(ids).toContain('preset-voxel-matrix');
    expect(ids).toContain('preset-waveform-ridgelines');
  });

  it('includes 5 distinct color palettes with valid hex values', () => {
    const paletteKeys = Object.keys(COLOR_PALETTES);
    expect(paletteKeys.length).toBe(5);
    expect(paletteKeys).toContain('cyberpunk');
    expect(paletteKeys).toContain('deep-space');
    expect(paletteKeys).toContain('electric-violet');
    expect(paletteKeys).toContain('retro-sunset');
    expect(paletteKeys).toContain('monochrome');

    for (const key of paletteKeys) {
      const p = COLOR_PALETTES[key as keyof typeof COLOR_PALETTES];
      expect(p.primaryHex).toBeTypeOf('number');
      expect(p.secondaryHex).toBeTypeOf('number');
      expect(p.accentHex).toBeTypeOf('number');
      expect(p.bgHex).toBeTypeOf('number');
      expect(p.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('validates preset schema with isValidPreset', () => {
    expect(isValidPreset(DEFAULT_PRESET)).toBe(true);
    expect(isValidPreset(null)).toBe(false);
    expect(isValidPreset({})).toBe(false);
    expect(
      isValidPreset({
        id: 'test',
        name: 'Test',
        sceneId: 'invalid-scene',
        paletteId: 'cyberpunk',
        bassSensitivity: 1,
        midSensitivity: 1,
        trebleSensitivity: 1,
        motionSpeed: 1
      })
    ).toBe(false);
  });

  it('correctly parses JSON preset string arrays and objects', () => {
    const samplePreset: PresetConfig = {
      id: 'custom-1',
      name: 'Test Preset',
      sceneId: 'neon-tunnel',
      paletteId: 'cyberpunk',
      bassSensitivity: 1.5,
      midSensitivity: 1.0,
      trebleSensitivity: 1.2,
      motionSpeed: 1.0,
      cameraShake: true,
      cameraShakeIntensity: 1.0,
      bloomIntensity: 1.2,
      particleDensity: 1.0
    };

    const singleJson = JSON.stringify(samplePreset);
    const singleResult = parsePresetsJson(singleJson);
    expect(singleResult.presets.length).toBe(1);
    expect(singleResult.presets[0].name).toBe('Test Preset');

    const arrayJson = JSON.stringify([samplePreset]);
    const arrayResult = parsePresetsJson(arrayJson);
    expect(arrayResult.presets.length).toBe(1);
    expect(arrayResult.presets[0].id).toBe('custom-1');

    const badJson = '{ invalid syntax }';
    const badResult = parsePresetsJson(badJson);
    expect(badResult.error).toBeDefined();
    expect(badResult.presets.length).toBe(0);
  });
});
