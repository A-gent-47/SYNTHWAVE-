export type ColorPaletteId =
  | 'cyberpunk'
  | 'deep-space'
  | 'electric-violet'
  | 'retro-sunset'
  | 'monochrome';

export interface ColorPalette {
  id: ColorPaletteId;
  name: string;
  primary: string;    // CSS hex color string
  secondary: string;
  accent: string;
  background: string;
  primaryHex: number; // Three.js hex number (0x00f0ff)
  secondaryHex: number;
  accentHex: number;
  bgHex: number;
}

export type SceneId =
  | 'neon-tunnel'
  | 'particle-universe'
  | 'synthwave-horizon'
  | 'ferrofluid'
  | 'voxel-matrix'
  | 'waveform-ridgelines'
  | 'crystal-lattice'
  | 'cyber-city'
  | 'dna-helix'
  | 'plasma-vortex';

export interface PresetConfig {
  id: string;
  name: string;
  isBuiltIn?: boolean;
  sceneId: SceneId;
  paletteId: ColorPaletteId;
  bassSensitivity: number;       // 0.1 to 3.0
  midSensitivity: number;        // 0.1 to 3.0
  trebleSensitivity: number;     // 0.1 to 3.0
  motionSpeed: number;           // 0.2 to 2.5
  cameraShake: boolean;          // true / false
  cameraShakeIntensity: number;  // 0.0 to 2.0
  bloomIntensity: number;        // 0.5 to 2.0
  particleDensity: number;       // 0.5 to 2.0
}

export const COLOR_PALETTES: Record<ColorPaletteId, ColorPalette> = {
  cyberpunk: {
    id: 'cyberpunk',
    name: 'CYBERPUNK NEON',
    primary: '#00f0ff',
    secondary: '#ff007f',
    accent: '#ffb700',
    background: '#050508',
    primaryHex: 0x00f0ff,
    secondaryHex: 0xff007f,
    accentHex: 0xffb700,
    bgHex: 0x050508
  },
  'deep-space': {
    id: 'deep-space',
    name: 'DEEP SPACE',
    primary: '#00d4ff',
    secondary: '#7928ca',
    accent: '#4361ee',
    background: '#02020a',
    primaryHex: 0x00d4ff,
    secondaryHex: 0x7928ca,
    accentHex: 0x4361ee,
    bgHex: 0x02020a
  },
  'electric-violet': {
    id: 'electric-violet',
    name: 'ELECTRIC VIOLET',
    primary: '#bd00ff',
    secondary: '#ff00aa',
    accent: '#00ff88',
    background: '#0a0414',
    primaryHex: 0xbd00ff,
    secondaryHex: 0xff00aa,
    accentHex: 0x00ff88,
    bgHex: 0x0a0414
  },
  'retro-sunset': {
    id: 'retro-sunset',
    name: 'RETRO SUNSET',
    primary: '#ff5500',
    secondary: '#ff0077',
    accent: '#ffcc00',
    background: '#14050d',
    primaryHex: 0xff5500,
    secondaryHex: 0xff0077,
    accentHex: 0xffcc00,
    bgHex: 0x14050d
  },
  monochrome: {
    id: 'monochrome',
    name: 'MONOCHROME VOLTAGE',
    primary: '#e0e0e0',
    secondary: '#ffffff',
    accent: '#888888',
    background: '#080808',
    primaryHex: 0xe0e0e0,
    secondaryHex: 0xffffff,
    accentHex: 0x888888,
    bgHex: 0x080808
  }
};

export const BUILT_IN_PRESETS: PresetConfig[] = [
  {
    id: 'preset-cyberpunk',
    name: 'Cyberpunk Neon',
    isBuiltIn: true,
    sceneId: 'neon-tunnel',
    paletteId: 'cyberpunk',
    bassSensitivity: 1.2,
    midSensitivity: 1.0,
    trebleSensitivity: 1.1,
    motionSpeed: 1.0,
    cameraShake: true,
    cameraShakeIntensity: 1.0,
    bloomIntensity: 1.2,
    particleDensity: 1.0
  },
  {
    id: 'preset-deep-space',
    name: 'Deep Space',
    isBuiltIn: true,
    sceneId: 'particle-universe',
    paletteId: 'deep-space',
    bassSensitivity: 0.9,
    midSensitivity: 1.3,
    trebleSensitivity: 1.4,
    motionSpeed: 0.7,
    cameraShake: false,
    cameraShakeIntensity: 0.0,
    bloomIntensity: 1.0,
    particleDensity: 1.5
  },
  {
    id: 'preset-electric-violet',
    name: 'Electric Violet',
    isBuiltIn: true,
    sceneId: 'neon-tunnel',
    paletteId: 'electric-violet',
    bassSensitivity: 1.4,
    midSensitivity: 0.9,
    trebleSensitivity: 1.2,
    motionSpeed: 1.2,
    cameraShake: true,
    cameraShakeIntensity: 1.2,
    bloomIntensity: 1.5,
    particleDensity: 1.0
  },
  {
    id: 'preset-retro-sunset',
    name: 'Retro Sunset',
    isBuiltIn: true,
    sceneId: 'synthwave-horizon',
    paletteId: 'retro-sunset',
    bassSensitivity: 1.1,
    midSensitivity: 1.1,
    trebleSensitivity: 1.0,
    motionSpeed: 0.9,
    cameraShake: false,
    cameraShakeIntensity: 0.0,
    bloomIntensity: 1.3,
    particleDensity: 0.8
  },
  {
    id: 'preset-monochrome',
    name: 'Monochrome Voltage',
    isBuiltIn: true,
    sceneId: 'particle-universe',
    paletteId: 'monochrome',
    bassSensitivity: 1.5,
    midSensitivity: 1.2,
    trebleSensitivity: 1.5,
    motionSpeed: 1.1,
    cameraShake: true,
    cameraShakeIntensity: 1.0,
    bloomIntensity: 1.6,
    particleDensity: 1.2
  },
  {
    id: 'preset-ferrofluid',
    name: 'Ferrofluid Singularity',
    isBuiltIn: true,
    sceneId: 'ferrofluid',
    paletteId: 'deep-space',
    bassSensitivity: 1.3,
    midSensitivity: 1.2,
    trebleSensitivity: 1.0,
    motionSpeed: 0.9,
    cameraShake: true,
    cameraShakeIntensity: 0.8,
    bloomIntensity: 1.4,
    particleDensity: 1.2
  },
  {
    id: 'preset-voxel-matrix',
    name: 'Voxel Matrix',
    isBuiltIn: true,
    sceneId: 'voxel-matrix',
    paletteId: 'cyberpunk',
    bassSensitivity: 1.4,
    midSensitivity: 1.1,
    trebleSensitivity: 1.2,
    motionSpeed: 1.1,
    cameraShake: true,
    cameraShakeIntensity: 1.0,
    bloomIntensity: 1.3,
    particleDensity: 1.0
  },
  {
    id: 'preset-waveform-ridgelines',
    name: 'Waveform Ridgelines',
    isBuiltIn: true,
    sceneId: 'waveform-ridgelines',
    paletteId: 'retro-sunset',
    bassSensitivity: 1.5,
    midSensitivity: 1.2,
    trebleSensitivity: 1.3,
    motionSpeed: 1.0,
    cameraShake: false,
    cameraShakeIntensity: 0.0,
    bloomIntensity: 1.5,
    particleDensity: 1.0
  }
];

export const DEFAULT_PRESET = BUILT_IN_PRESETS[0];

const STORAGE_KEY = 'synthwave_custom_presets_v1';

export function loadSavedCustomPresets(): PresetConfig[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(isValidPreset);
    }
  } catch (err) {
    console.warn('Failed to load custom presets from localStorage:', err);
  }
  return [];
}

export function saveCustomPresetsToStorage(presets: PresetConfig[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch (err) {
    console.warn('Failed to save custom presets to localStorage:', err);
  }
}

export function isValidPreset(obj: unknown): obj is PresetConfig {
  if (!obj || typeof obj !== 'object') return false;
  const p = obj as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    typeof p.name === 'string' &&
    typeof p.sceneId === 'string' &&
    [
      'neon-tunnel',
      'particle-universe',
      'synthwave-horizon',
      'ferrofluid',
      'voxel-matrix',
      'waveform-ridgelines',
      'crystal-lattice',
      'cyber-city',
      'dna-helix',
      'plasma-vortex'
    ].includes(p.sceneId) &&
    typeof p.paletteId === 'string' &&
    ['cyberpunk', 'deep-space', 'electric-violet', 'retro-sunset', 'monochrome'].includes(p.paletteId) &&
    typeof p.bassSensitivity === 'number' &&
    typeof p.midSensitivity === 'number' &&
    typeof p.trebleSensitivity === 'number' &&
    typeof p.motionSpeed === 'number'
  );
}

export function parsePresetsJson(jsonStr: string): { presets: PresetConfig[]; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      const valid = parsed.filter(isValidPreset);
      if (valid.length === 0) {
        return { presets: [], error: 'No valid presets found in JSON array.' };
      }
      return { presets: valid };
    } else if (isValidPreset(parsed)) {
      return { presets: [parsed] };
    } else {
      return { presets: [], error: 'JSON does not match Synthwave preset schema.' };
    }
  } catch (e) {
    return { presets: [], error: `Invalid JSON syntax: ${(e as Error).message}` };
  }
}
