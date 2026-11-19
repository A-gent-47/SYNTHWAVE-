import { create } from 'zustand';
import {
  ColorPaletteId,
  PresetConfig,
  SceneId,
  DEFAULT_PRESET,
  BUILT_IN_PRESETS,
  loadSavedCustomPresets,
  saveCustomPresetsToStorage,
  parsePresetsJson
} from '../visualizer/presets';
import { AudioEngine } from '../audio/AudioEngine';

export type { ColorPaletteId, PresetConfig, SceneId };

interface VisualizerStoreState {
  // Active Scene
  activeSceneId: SceneId;
  activePresetId: string;

  // Visual & Color Customization
  paletteId: ColorPaletteId;
  bassSensitivity: number;       // 0.1 to 3.0
  midSensitivity: number;        // 0.1 to 3.0
  trebleSensitivity: number;     // 0.1 to 3.0
  motionSpeed: number;           // 0.2 to 2.5
  cameraShake: boolean;          // true / false
  cameraShakeIntensity: number;  // 0.0 to 2.0
  bloomIntensity: number;        // 0.5 to 2.0
  particleDensity: number;       // 0.5 to 2.0

  // System Controls
  reducedEffects: boolean;
  autoSceneSwitching: boolean;
  isAnimationPaused: boolean;

  // Custom Presets
  customPresets: PresetConfig[];

  // Actions
  setActiveSceneId: (sceneId: SceneId) => void;
  setPaletteId: (paletteId: ColorPaletteId) => void;
  setBassSensitivity: (val: number) => void;
  setMidSensitivity: (val: number) => void;
  setTrebleSensitivity: (val: number) => void;
  setMotionSpeed: (val: number) => void;
  setCameraShake: (enabled: boolean) => void;
  setCameraShakeIntensity: (val: number) => void;
  setBloomIntensity: (val: number) => void;
  setParticleDensity: (val: number) => void;
  toggleReducedEffects: () => void;
  setAutoSceneSwitching: (enabled: boolean) => void;
  toggleAnimationPause: () => void;
  applyPreset: (preset: PresetConfig) => void;
  saveCustomPreset: (name: string) => PresetConfig;
  deleteCustomPreset: (id: string) => void;
  exportPresetsJson: () => string;
  importPresetsJson: (jsonStr: string) => { success: boolean; count?: number; error?: string };
  resetToDefaults: () => void;
}

const initialCustomPresets = loadSavedCustomPresets();

export const useVisualizerStore = create<VisualizerStoreState>((set, get) => ({
  activeSceneId: DEFAULT_PRESET.sceneId,
  activePresetId: DEFAULT_PRESET.id,
  paletteId: DEFAULT_PRESET.paletteId,
  bassSensitivity: DEFAULT_PRESET.bassSensitivity,
  midSensitivity: DEFAULT_PRESET.midSensitivity,
  trebleSensitivity: DEFAULT_PRESET.trebleSensitivity,
  motionSpeed: DEFAULT_PRESET.motionSpeed,
  cameraShake: DEFAULT_PRESET.cameraShake,
  cameraShakeIntensity: DEFAULT_PRESET.cameraShakeIntensity,
  bloomIntensity: DEFAULT_PRESET.bloomIntensity,
  particleDensity: DEFAULT_PRESET.particleDensity,

  reducedEffects: false,
  autoSceneSwitching: false,
  isAnimationPaused: false,

  customPresets: initialCustomPresets,

  setActiveSceneId: (sceneId: SceneId) => set({ activeSceneId: sceneId }),

  setPaletteId: (paletteId: ColorPaletteId) => set({ paletteId }),

  setBassSensitivity: (val: number) => {
    const clamped = Math.max(0.1, Math.min(3.0, Number(val.toFixed(2))));
    const { midSensitivity, trebleSensitivity } = get();
    AudioEngine.getInstance().setSensitivity(clamped, midSensitivity, trebleSensitivity);
    set({ bassSensitivity: clamped });
  },

  setMidSensitivity: (val: number) => {
    const clamped = Math.max(0.1, Math.min(3.0, Number(val.toFixed(2))));
    const { bassSensitivity, trebleSensitivity } = get();
    AudioEngine.getInstance().setSensitivity(bassSensitivity, clamped, trebleSensitivity);
    set({ midSensitivity: clamped });
  },

  setTrebleSensitivity: (val: number) => {
    const clamped = Math.max(0.1, Math.min(3.0, Number(val.toFixed(2))));
    const { bassSensitivity, midSensitivity } = get();
    AudioEngine.getInstance().setSensitivity(bassSensitivity, midSensitivity, clamped);
    set({ trebleSensitivity: clamped });
  },

  setMotionSpeed: (val: number) => {
    set({ motionSpeed: Math.max(0.2, Math.min(2.5, Number(val.toFixed(2)))) });
  },

  setCameraShake: (enabled: boolean) => set({ cameraShake: enabled }),

  setCameraShakeIntensity: (val: number) => {
    set({ cameraShakeIntensity: Math.max(0.0, Math.min(2.0, Number(val.toFixed(2)))) });
  },

  setBloomIntensity: (val: number) => {
    set({ bloomIntensity: Math.max(0.5, Math.min(2.0, Number(val.toFixed(2)))) });
  },

  setParticleDensity: (val: number) => {
    set({ particleDensity: Math.max(0.5, Math.min(2.0, Number(val.toFixed(2)))) });
  },

  toggleReducedEffects: () => {
    const nextVal = !get().reducedEffects;
    if (nextVal) {
      // Reduce motion, camera shake, and bloom for accessibility/performance
      set({
        reducedEffects: true,
        cameraShake: false,
        cameraShakeIntensity: 0.0,
        bloomIntensity: 0.8,
        particleDensity: 0.6
      });
    } else {
      set({
        reducedEffects: false,
        cameraShake: true,
        cameraShakeIntensity: 1.0,
        bloomIntensity: 1.2,
        particleDensity: 1.0
      });
    }
  },

  setAutoSceneSwitching: (enabled: boolean) => set({ autoSceneSwitching: enabled }),

  toggleAnimationPause: () => set((state) => ({ isAnimationPaused: !state.isAnimationPaused })),

  applyPreset: (preset: PresetConfig) => {
    AudioEngine.getInstance().setSensitivity(
      preset.bassSensitivity,
      preset.midSensitivity,
      preset.trebleSensitivity
    );

    set({
      activePresetId: preset.id,
      activeSceneId: preset.sceneId,
      paletteId: preset.paletteId,
      bassSensitivity: preset.bassSensitivity,
      midSensitivity: preset.midSensitivity,
      trebleSensitivity: preset.trebleSensitivity,
      motionSpeed: preset.motionSpeed,
      cameraShake: preset.cameraShake,
      cameraShakeIntensity: preset.cameraShakeIntensity,
      bloomIntensity: preset.bloomIntensity,
      particleDensity: preset.particleDensity
    });
  },

  saveCustomPreset: (name: string): PresetConfig => {
    const state = get();
    const newPreset: PresetConfig = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim() || `Custom Preset ${state.customPresets.length + 1}`,
      isBuiltIn: false,
      sceneId: state.activeSceneId,
      paletteId: state.paletteId,
      bassSensitivity: state.bassSensitivity,
      midSensitivity: state.midSensitivity,
      trebleSensitivity: state.trebleSensitivity,
      motionSpeed: state.motionSpeed,
      cameraShake: state.cameraShake,
      cameraShakeIntensity: state.cameraShakeIntensity,
      bloomIntensity: state.bloomIntensity,
      particleDensity: state.particleDensity
    };

    const updated = [...state.customPresets, newPreset];
    saveCustomPresetsToStorage(updated);
    set({
      customPresets: updated,
      activePresetId: newPreset.id
    });
    return newPreset;
  },

  deleteCustomPreset: (id: string) => {
    const updated = get().customPresets.filter((p) => p.id !== id);
    saveCustomPresetsToStorage(updated);
    set({
      customPresets: updated,
      activePresetId: get().activePresetId === id ? DEFAULT_PRESET.id : get().activePresetId
    });
  },

  exportPresetsJson: (): string => {
    const { customPresets } = get();
    const allPresets = [...BUILT_IN_PRESETS, ...customPresets];
    return JSON.stringify(allPresets, null, 2);
  },

  importPresetsJson: (jsonStr: string) => {
    const result = parsePresetsJson(jsonStr);
    if (result.error || result.presets.length === 0) {
      return { success: false, error: result.error || 'No valid presets in file' };
    }

    const current = get().customPresets;
    // Deduplicate by ID or name
    const existingIds = new Set(current.map((p) => p.id));
    const newItems = result.presets
      .filter((p) => !existingIds.has(p.id))
      .map((p) => ({ ...p, isBuiltIn: false }));

    const merged = [...current, ...newItems];
    saveCustomPresetsToStorage(merged);
    set({ customPresets: merged });

    // If imported at least one, activate the first imported preset
    if (newItems.length > 0) {
      get().applyPreset(newItems[0]);
    }

    return { success: true, count: newItems.length };
  },

  resetToDefaults: () => {
    get().applyPreset(DEFAULT_PRESET);
    set({
      reducedEffects: false,
      autoSceneSwitching: false,
      isAnimationPaused: false
    });
  }
}));
