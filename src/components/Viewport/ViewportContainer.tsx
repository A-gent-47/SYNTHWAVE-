import React, { useRef, useEffect, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { useAudioStore } from '../../store/audioStore';
import { useVisualizerStore } from '../../store/visualizerStore';
import { VisualizerCore } from '../../visualizer/VisualizerCore';
import { SceneManager } from '../../visualizer/SceneManager';
import { AudioMetrics } from '../../audio/types';
import styles from './ViewportContainer.module.css';

interface ViewportContainerProps {
  isHudVisible: boolean;
}

export const ViewportContainer: React.FC<ViewportContainerProps> = ({ isHudVisible }) => {
  const { currentTrack } = useAudioStore();
  const { activeSceneId } = useVisualizerStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const visualizerRef = useRef<VisualizerCore | null>(null);

  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Equalizer bar refs for high-frequency direct DOM updates without React re-renders
  const bassBarRef = useRef<HTMLDivElement>(null);
  const midBarRef = useRef<HTMLDivElement>(null);
  const trebleBarRef = useRef<HTMLDivElement>(null);
  const bassValRef = useRef<HTMLSpanElement>(null);
  const midValRef = useRef<HTMLSpanElement>(null);
  const trebleValRef = useRef<HTMLSpanElement>(null);

  // Switch scene when activeSceneId changes
  useEffect(() => {
    if (visualizerRef.current) {
      visualizerRef.current.switchScene(activeSceneId);
    }
  }, [activeSceneId]);

  // Initialize VisualizerCore and handle ResizeObserver
  useEffect(() => {
    if (!canvasHostRef.current) return;

    const visualizer = new VisualizerCore(canvasHostRef.current, (metrics: AudioMetrics) => {
      // Direct DOM updates for butter-smooth 60fps HUD meters without triggering React re-renders
      if (bassBarRef.current && bassValRef.current) {
        const bassPct = Math.round(metrics.bass * 100);
        bassBarRef.current.style.width = `${Math.min(100, bassPct)}%`;
        bassValRef.current.textContent = `${bassPct}%`;
      }
      if (midBarRef.current && midValRef.current) {
        const midPct = Math.round(metrics.mid * 100);
        midBarRef.current.style.width = `${Math.min(100, midPct)}%`;
        midValRef.current.textContent = `${midPct}%`;
      }
      if (trebleBarRef.current && trebleValRef.current) {
        const treblePct = Math.round(metrics.treble * 100);
        trebleBarRef.current.style.width = `${Math.min(100, treblePct)}%`;
        trebleValRef.current.textContent = `${treblePct}%`;
      }
    });

    visualizerRef.current = visualizer;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.round(entry.contentRect.width);
        const h = Math.round(entry.contentRect.height);
        visualizer.resize(w, h);
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      visualizer.dispose();
      visualizerRef.current = null;
    };
  }, []);

  return (
    <main
      ref={containerRef}
      className={styles.viewportContainer}
      role="main"
      aria-label="3D Music Visualizer Viewport"
      id="viewport-main"
    >
      {/* Perspective Grid Background */}
      <div className={styles.gridBackground} />

      {/* Cyber Reticle Centerpiece - Only on standby before a track is loaded */}
      {!currentTrack && <div className={styles.centerReticle} />}

      {/* Three.js Canvas Container */}
      <div ref={canvasHostRef} className={styles.canvasContainer} id="threejs-canvas-host" />

      {/* Modern Studio HUD Overlay */}
      {isHudVisible && (
        <div className={styles.hudOverlay}>
          {/* Top Left: Clean Active Scene Pill */}
          <div className={styles.sceneBadge}>
            <span className={styles.sceneBadgeDot} />
            <span className={styles.sceneBadgeText}>{SceneManager.getSceneDescriptor(activeSceneId).name}</span>
          </div>

          {/* Bottom Row: Minimal Equalizer on Left, Shortcuts Popover on Right */}
          <div className={styles.hudBottomRow}>
            {/* Live Web Audio Equalizer HUD Widget */}
            <div className={styles.equalizerWidget} aria-label="Audio Frequency Spectrum">
              <div className={styles.equalizerHeader}>
                <span className={styles.equalizerTitle}>EQUALIZER</span>
                <span className={styles.eqLiveDot} />
              </div>

              <div className={styles.eqBandRow}>
                <span className={styles.eqBandLabel}>BASS</span>
                <div className={styles.eqBarTrack}>
                  <div ref={bassBarRef} className={styles.eqBarFillBass} style={{ width: '0%' }} />
                </div>
                <span ref={bassValRef} className={styles.eqBandValue}>0%</span>
              </div>

              <div className={styles.eqBandRow}>
                <span className={styles.eqBandLabel}>MIDS</span>
                <div className={styles.eqBarTrack}>
                  <div ref={midBarRef} className={styles.eqBarFillMid} style={{ width: '0%' }} />
                </div>
                <span ref={midValRef} className={styles.eqBandValue}>0%</span>
              </div>

              <div className={styles.eqBandRow}>
                <span className={styles.eqBandLabel}>TREBLE</span>
                <div className={styles.eqBarTrack}>
                  <div ref={trebleBarRef} className={styles.eqBarFillTreble} style={{ width: '0%' }} />
                </div>
                <span ref={trebleValRef} className={styles.eqBandValue}>0%</span>
              </div>
            </div>

            {/* Keyboard Shortcuts Trigger & Popover */}
            <div className={styles.shortcutsContainer}>
              {isShortcutsOpen && (
                <div className={styles.shortcutsPopover} role="tooltip" aria-label="Keyboard Shortcuts">
                  <div className={styles.shortcutsHeader}>Shortcuts</div>
                  <div className={styles.shortcutItem}>
                    <span className={styles.kbd}>Space</span>
                    <span>Play / Pause</span>
                  </div>
                  <div className={styles.shortcutItem}>
                    <span className={styles.kbd}>N / B</span>
                    <span>Next / Prev</span>
                  </div>
                  <div className={styles.shortcutItem}>
                    <span className={styles.kbd}>S</span>
                    <span>Shuffle</span>
                  </div>
                  <div className={styles.shortcutItem}>
                    <span className={styles.kbd}>L</span>
                    <span>Library</span>
                  </div>
                  <div className={styles.shortcutItem}>
                    <span className={styles.kbd}>Q</span>
                    <span>Queue</span>
                  </div>
                  <div className={styles.shortcutItem}>
                    <span className={styles.kbd}>1 / 2 / 3</span>
                    <span>Switch Scene</span>
                  </div>
                  <div className={styles.shortcutItem}>
                    <span className={styles.kbd}>M</span>
                    <span>Mute</span>
                  </div>
                  <div className={styles.shortcutItem}>
                    <span className={styles.kbd}>H</span>
                    <span>Toggle HUD</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                className={`${styles.shortcutsTrigger} ${isShortcutsOpen ? styles.shortcutsTriggerActive : ''}`}
                onClick={() => setIsShortcutsOpen(!isShortcutsOpen)}
                title="Keyboard shortcuts"
                aria-label="Keyboard shortcuts"
                aria-expanded={isShortcutsOpen}
              >
                <HelpCircle size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
