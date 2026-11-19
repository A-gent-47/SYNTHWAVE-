import React, { useState, useRef } from 'react';
import {
  Sliders,
  Layers,
  Bookmark,
  X,
  Sparkles,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  Play,
  Pause
} from 'lucide-react';
import { useVisualizerStore, SceneId, ColorPaletteId } from '../../store/visualizerStore';
import { AVAILABLE_SCENES } from '../../visualizer/SceneManager';
import {
  COLOR_PALETTES,
  BUILT_IN_PRESETS
} from '../../visualizer/presets';
import { useAudioStore } from '../../store/audioStore';
import styles from './SidePanel.module.css';

interface SidePanelProps {
  isHudVisible: boolean;
}

export const SidePanel: React.FC<SidePanelProps> = ({ isHudVisible }) => {
  const [activeTab, setActiveTab] = useState<'none' | 'scenes' | 'presets' | 'settings'>('none');
  const [customPresetName, setCustomPresetName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    activeSceneId,
    setActiveSceneId,
    activePresetId,
    paletteId,
    setPaletteId,
    bassSensitivity,
    setBassSensitivity,
    midSensitivity,
    setMidSensitivity,
    trebleSensitivity,
    setTrebleSensitivity,
    motionSpeed,
    setMotionSpeed,
    cameraShake,
    setCameraShake,
    bloomIntensity,
    setBloomIntensity,
    particleDensity,
    setParticleDensity,
    autoSceneSwitching,
    setAutoSceneSwitching,
    isAnimationPaused,
    toggleAnimationPause,
    reducedEffects,
    toggleReducedEffects,
    customPresets,
    applyPreset,
    saveCustomPreset,
    deleteCustomPreset,
    exportPresetsJson,
    importPresetsJson,
    resetToDefaults
  } = useVisualizerStore();

  const setError = useAudioStore((s) => s.setError);

  if (!isHudVisible) return null;

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPresetName.trim()) return;
    saveCustomPreset(customPresetName.trim());
    setCustomPresetName('');
  };

  const handleExport = () => {
    try {
      const dataStr = exportPresetsJson();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `synthwave-presets-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Failed to export presets: ${(err as Error).message}`);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importPresetsJson(content);
      if (!res.success) {
        setError(res.error || 'Failed to import presets.');
      }
    };
    reader.onerror = () => {
      setError('Could not read presets file.');
    };
    reader.readAsText(file);
    // Reset file input value so re-importing the same file works
    e.target.value = '';
  };

  return (
    <>
      {/* Floating Toggle Buttons */}
      <div className={styles.sidePanelToggle}>
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'scenes' ? 'none' : 'scenes')}
          className={`${styles.toggleButton} ${activeTab === 'scenes' ? styles.toggleButtonActive : ''}`}
          title="Scene Selection (Hotkeys 1-7)"
          id="btn-scenes-panel"
        >
          <Layers size={13} />
          <span>Scenes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'presets' ? 'none' : 'presets')}
          className={`${styles.toggleButton} ${activeTab === 'presets' ? styles.toggleButtonActive : ''}`}
          title="Presets Library"
          id="btn-presets-panel"
        >
          <Bookmark size={13} />
          <span>Presets</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'settings' ? 'none' : 'settings')}
          className={`${styles.toggleButton} ${activeTab === 'settings' ? styles.toggleButtonActive : ''}`}
          title="Audio Customization & Settings"
          id="btn-settings-panel"
        >
          <Sliders size={13} />
          <span>Config</span>
        </button>
      </div>

      {/* Slide-out Drawer */}
      <aside
        className={`${styles.drawer} ${activeTab !== 'none' ? styles.drawerOpen : ''}`}
        aria-label="Side customization panel"
      >
        <div className={styles.drawerHeader}>
          <div className={styles.drawerTitle}>
            {activeTab === 'scenes' && (
              <>
                <Layers size={17} color="var(--neon-cyan)" />
                <span>3D SCENE SELECTION</span>
              </>
            )}
            {activeTab === 'presets' && (
              <>
                <Bookmark size={17} color="var(--neon-amber)" />
                <span>PRESET VAULT</span>
              </>
            )}
            {activeTab === 'settings' && (
              <>
                <Sliders size={17} color="var(--neon-magenta)" />
                <span>CYBERNETIC CONFIG</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('none')}
            className={styles.closeButton}
            aria-label="Close panel"
            id="btn-close-side-panel"
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.drawerBody}>
          {/* TAB 1: SCENES */}
          {activeTab === 'scenes' && (
            <>
              {AVAILABLE_SCENES.map((scene) => {
                const isActive = activeSceneId === scene.id;
                return (
                  <div
                    key={scene.id}
                    className={`${styles.sceneCard} ${isActive ? styles.cardActive : ''}`}
                    onClick={() => setActiveSceneId(scene.id as SceneId)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setActiveSceneId(scene.id as SceneId);
                      }
                    }}
                    id={`scene-select-${scene.id}`}
                  >
                    <span className={styles.sceneBadge}>
                      {isActive ? 'ACTIVE' : `KEY [${scene.shortcut}]`}
                    </span>
                    <span className={styles.sceneName}>{scene.name}</span>
                    <p className={styles.sceneDesc}>{scene.description}</p>
                  </div>
                );
              })}

              <div className={styles.toggleRow}>
                <span>Auto-Cycle Scenes (30s)</span>
                <button
                  type="button"
                  onClick={() => setAutoSceneSwitching(!autoSceneSwitching)}
                  className={`${styles.switchButton} ${autoSceneSwitching ? styles.switchButtonOn : ''}`}
                  id="btn-toggle-auto-scene"
                >
                  {autoSceneSwitching ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              <div className={styles.checkpointNote}>
                <Sparkles size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                Click any scene card or press keyboard hotkeys 1, 2, or 3 to transition environments.
              </div>
            </>
          )}

          {/* TAB 2: PRESETS */}
          {activeTab === 'presets' && (
            <>
              <div className={styles.sectionHeader}>Factory Presets</div>

              {BUILT_IN_PRESETS.map((preset) => {
                const isActive = activePresetId === preset.id;
                const palette = COLOR_PALETTES[preset.paletteId];
                return (
                  <div
                    key={preset.id}
                    className={`${styles.presetCard} ${isActive ? styles.cardActive : ''}`}
                    onClick={() => applyPreset(preset)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') applyPreset(preset);
                    }}
                    id={`preset-${preset.id}`}
                  >
                    <span className={styles.presetBadge}>
                      {isActive ? 'LOADED' : 'BUILT-IN'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className={styles.presetName}>{preset.name}</span>
                      <div className={styles.paletteSwatches} style={{ marginLeft: 'auto', marginRight: '4rem' }}>
                        <div className={styles.swatchCircle} style={{ background: palette.primary }} />
                        <div className={styles.swatchCircle} style={{ background: palette.secondary }} />
                        <div className={styles.swatchCircle} style={{ background: palette.accent }} />
                      </div>
                    </div>
                    <p className={styles.presetDesc}>
                      {preset.sceneId.toUpperCase()} • Speed {preset.motionSpeed}x • Bass {preset.bassSensitivity}x
                    </p>
                  </div>
                );
              })}

              <div className={styles.sectionHeader}>User Custom Presets</div>

              <form onSubmit={handleSavePreset} className={styles.customPresetForm}>
                <input
                  type="text"
                  placeholder="Preset Name..."
                  value={customPresetName}
                  onChange={(e) => setCustomPresetName(e.target.value)}
                  className={styles.presetInput}
                  maxLength={24}
                  id="input-preset-name"
                />
                <button type="submit" className={styles.savePresetBtn} id="btn-save-preset">
                  SAVE
                </button>
              </form>

              {customPresets.map((preset) => {
                const isActive = activePresetId === preset.id;
                return (
                  <div key={preset.id} className={styles.customPresetItem}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.75rem', color: isActive ? 'var(--neon-cyan)' : '#fff' }}>
                        {preset.name}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {preset.sceneId} • {preset.paletteId}
                      </div>
                    </div>
                    <div className={styles.customPresetActions}>
                      <button
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className={`${styles.switchButton} ${isActive ? styles.switchButtonOn : ''}`}
                        title="Load Preset"
                      >
                        {isActive ? 'ACTIVE' : 'LOAD'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCustomPreset(preset.id)}
                        className={styles.iconBtn}
                        title="Delete Preset"
                        aria-label={`Delete preset ${preset.name}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}

              <div className={styles.sectionHeader}>Export & Import</div>
              <div className={styles.btnGroup}>
                <button type="button" onClick={handleExport} className={styles.actionBtn} id="btn-export-presets">
                  <Download size={13} />
                  <span>EXPORT JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={styles.actionBtn}
                  id="btn-import-presets"
                >
                  <Upload size={13} />
                  <span>IMPORT JSON</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  style={{ display: 'none' }}
                  onChange={handleImportFile}
                  id="file-input-preset"
                />
              </div>
            </>
          )}

          {/* TAB 3: CONFIG & AUDIO SENSITIVITY */}
          {activeTab === 'settings' && (
            <>
              <div className={styles.sectionHeader}>DSP Audio Sensitivity</div>

              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <span>BASS MULTIPLIER</span>
                  <span className={styles.settingValue}>{bassSensitivity.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.05"
                  value={bassSensitivity}
                  onChange={(e) => setBassSensitivity(parseFloat(e.target.value))}
                  id="slider-bass-sensitivity"
                />
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <span>MIDS SENSITIVITY</span>
                  <span className={styles.settingValue}>{midSensitivity.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.05"
                  value={midSensitivity}
                  onChange={(e) => setMidSensitivity(parseFloat(e.target.value))}
                  id="slider-mid-sensitivity"
                />
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <span>TREBLE SCINTILLATION</span>
                  <span className={styles.settingValue}>{trebleSensitivity.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.05"
                  value={trebleSensitivity}
                  onChange={(e) => setTrebleSensitivity(parseFloat(e.target.value))}
                  id="slider-treble-sensitivity"
                />
              </div>

              <div className={styles.sectionHeader}>Color Palette</div>
              <div className={styles.paletteGrid}>
                {Object.values(COLOR_PALETTES).map((pal) => {
                  const isSelected = paletteId === pal.id;
                  return (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() => setPaletteId(pal.id as ColorPaletteId)}
                      className={`${styles.paletteButton} ${isSelected ? styles.paletteActive : ''}`}
                      id={`palette-btn-${pal.id}`}
                    >
                      <span className={styles.paletteName}>{pal.name}</span>
                      <div className={styles.paletteSwatches}>
                        <div className={styles.swatchCircle} style={{ background: pal.primary }} />
                        <div className={styles.swatchCircle} style={{ background: pal.secondary }} />
                        <div className={styles.swatchCircle} style={{ background: pal.accent }} />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className={styles.sectionHeader}>Visual Dynamics</div>

              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <span>MOTION SPEED</span>
                  <span className={styles.settingValue}>{motionSpeed.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.05"
                  value={motionSpeed}
                  onChange={(e) => setMotionSpeed(parseFloat(e.target.value))}
                  id="slider-motion-speed"
                />
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <span>BLOOM & GLOW</span>
                  <span className={styles.settingValue}>{bloomIntensity.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={bloomIntensity}
                  onChange={(e) => setBloomIntensity(parseFloat(e.target.value))}
                  id="slider-bloom-intensity"
                />
              </div>

              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <span>PARTICLE DENSITY</span>
                  <span className={styles.settingValue}>{particleDensity.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={particleDensity}
                  onChange={(e) => setParticleDensity(parseFloat(e.target.value))}
                  id="slider-particle-density"
                />
              </div>

              <div className={styles.sectionHeader}>Accessibility & Toggles</div>

              <div className={styles.toggleRow}>
                <span>Camera Shake / Sway</span>
                <button
                  type="button"
                  onClick={() => setCameraShake(!cameraShake)}
                  className={`${styles.switchButton} ${cameraShake ? styles.switchButtonOn : ''}`}
                  id="btn-toggle-camera-shake"
                >
                  {cameraShake ? 'ACTIVE' : 'OFF'}
                </button>
              </div>

              <div className={styles.toggleRow}>
                <span>Freeze Visuals (Key P)</span>
                <button
                  type="button"
                  onClick={toggleAnimationPause}
                  className={`${styles.switchButton} ${isAnimationPaused ? styles.switchButtonOn : ''}`}
                  id="btn-toggle-animation-pause"
                >
                  {isAnimationPaused ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Pause size={10} /> FROZEN
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Play size={10} /> RUNNING
                    </span>
                  )}
                </button>
              </div>

              <div className={styles.toggleRow}>
                <span>Reduced Effects Mode</span>
                <button
                  type="button"
                  onClick={toggleReducedEffects}
                  className={`${styles.switchButton} ${reducedEffects ? styles.switchButtonOn : ''}`}
                  id="btn-toggle-reduced-effects"
                >
                  {reducedEffects ? 'ON' : 'OFF'}
                </button>
              </div>

              <button
                type="button"
                onClick={resetToDefaults}
                className={styles.resetBtn}
                id="btn-reset-defaults"
              >
                <RotateCcw size={13} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '6px' }} />
                RESET FACTORY DEFAULTS [KEY R]
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
};
