import { describe, it, expect, beforeEach } from 'vitest';
import { useVisualizerStore } from './visualizerStore';
import { BUILT_IN_PRESETS } from '../visualizer/presets';

describe('visualizerStore', () => {
  beforeEach(() => {
    useVisualizerStore.getState().resetToDefaults();
  });

  it('initializes with default preset and configuration', () => {
    const state = useVisualizerStore.getState();
    expect(state.activeSceneId).toBe('neon-tunnel');
    expect(state.paletteId).toBe('cyberpunk');
    expect(state.reducedEffects).toBe(false);
    expect(state.isAnimationPaused).toBe(false);
    expect(state.autoSceneSwitching).toBe(false);
  });

  it('switches active scene correctly', () => {
    useVisualizerStore.getState().setActiveSceneId('particle-universe');
    expect(useVisualizerStore.getState().activeSceneId).toBe('particle-universe');

    useVisualizerStore.getState().setActiveSceneId('synthwave-horizon');
    expect(useVisualizerStore.getState().activeSceneId).toBe('synthwave-horizon');
  });

  it('adjusts audio sensitivity with clamping (0.1 to 3.0)', () => {
    useVisualizerStore.getState().setBassSensitivity(2.2);
    expect(useVisualizerStore.getState().bassSensitivity).toBe(2.2);

    useVisualizerStore.getState().setBassSensitivity(5.0);
    expect(useVisualizerStore.getState().bassSensitivity).toBe(3.0);

    useVisualizerStore.getState().setMidSensitivity(0.01);
    expect(useVisualizerStore.getState().midSensitivity).toBe(0.1);

    useVisualizerStore.getState().setTrebleSensitivity(1.75);
    expect(useVisualizerStore.getState().trebleSensitivity).toBe(1.75);
  });

  it('applies built-in presets correctly', () => {
    const retroPreset = BUILT_IN_PRESETS.find((p) => p.id === 'preset-retro-sunset')!;
    expect(retroPreset).toBeDefined();

    useVisualizerStore.getState().applyPreset(retroPreset);
    const state = useVisualizerStore.getState();
    expect(state.activePresetId).toBe('preset-retro-sunset');
    expect(state.activeSceneId).toBe('synthwave-horizon');
    expect(state.paletteId).toBe('retro-sunset');
    expect(state.bassSensitivity).toBe(retroPreset.bassSensitivity);
    expect(state.motionSpeed).toBe(retroPreset.motionSpeed);
  });

  it('saves and deletes custom presets', () => {
    const created = useVisualizerStore.getState().saveCustomPreset('My Sunset Vapor');
    expect(created.name).toBe('My Sunset Vapor');
    expect(useVisualizerStore.getState().customPresets.some((p) => p.id === created.id)).toBe(true);

    useVisualizerStore.getState().deleteCustomPreset(created.id);
    expect(useVisualizerStore.getState().customPresets.some((p) => p.id === created.id)).toBe(false);
  });

  it('exports and imports presets JSON successfully', () => {
    const exportedJson = useVisualizerStore.getState().exportPresetsJson();
    expect(exportedJson).toContain('preset-cyberpunk');

    const result = useVisualizerStore.getState().importPresetsJson(exportedJson);
    expect(result.success).toBe(true);

    const badResult = useVisualizerStore.getState().importPresetsJson('invalid');
    expect(badResult.success).toBe(false);
  });

  it('toggles animation pause and reduced effects', () => {
    expect(useVisualizerStore.getState().isAnimationPaused).toBe(false);
    useVisualizerStore.getState().toggleAnimationPause();
    expect(useVisualizerStore.getState().isAnimationPaused).toBe(true);

    expect(useVisualizerStore.getState().reducedEffects).toBe(false);
    useVisualizerStore.getState().toggleReducedEffects();
    expect(useVisualizerStore.getState().reducedEffects).toBe(true);
    expect(useVisualizerStore.getState().cameraShake).toBe(false);
  });

  it('resets to factory defaults', () => {
    useVisualizerStore.getState().setBassSensitivity(2.9);
    useVisualizerStore.getState().toggleAnimationPause();
    useVisualizerStore.getState().setAutoSceneSwitching(true);

    useVisualizerStore.getState().resetToDefaults();
    const state = useVisualizerStore.getState();
    expect(state.bassSensitivity).toBe(BUILT_IN_PRESETS[0].bassSensitivity);
    expect(state.isAnimationPaused).toBe(false);
    expect(state.autoSceneSwitching).toBe(false);
  });
});
