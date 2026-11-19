import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { Header } from './components/Header/Header';
import { AudioPlayer } from './components/AudioPlayer/AudioPlayer';
import { FileDropzone } from './components/FileDropzone/FileDropzone';
import { ViewportContainer } from './components/Viewport/ViewportContainer';
import { SidePanel } from './components/SidePanel/SidePanel';
import { ErrorAlert } from './components/ErrorAlert/ErrorAlert';
import { LibraryView } from './components/Library/LibraryView';
import { QueueDrawer } from './components/Queue/QueueDrawer';
import { useAudioStore } from './store/audioStore';
import { usePlaylistStore } from './store/playlistStore';
import { useVisualizerStore } from './store/visualizerStore';
import { AudioEngine } from './audio/AudioEngine';
import { SceneId } from './visualizer/presets';
import styles from './App.module.css';


export const App: React.FC = () => {
  const [isHudVisible, setIsHudVisible] = useState(true);
  const [isWindowDragging, setIsWindowDragging] = useState(false);

  const {
    currentTrack,
    togglePlay,
    toggleMute,
    seek,
    currentTime
  } = useAudioStore();

  const {
    playNext,
    playPrevious,
    toggleShuffle,
    toggleLibrary,
    toggleQueue,
    importFiles,
    playTrack
  } = usePlaylistStore();

  const {
    activeSceneId,
    setActiveSceneId,
    autoSceneSwitching,
    toggleAnimationPause,
    resetToDefaults
  } = useVisualizerStore();

  // Unlock Web Audio API context on any user interaction gesture
  useEffect(() => {
    const unlockAudio = () => {
      AudioEngine.getInstance().resume().catch(() => {});
    };
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);


  // Auto-scene switcher timer (cycles scene every 30 seconds if enabled)
  useEffect(() => {
    if (!autoSceneSwitching) return;

    const scenes: SceneId[] = [
      'neon-tunnel',
      'particle-universe',
      'synthwave-horizon',
      'ferrofluid',
      'voxel-matrix',
      'waveform-ridgelines'
    ];

    const timer = setInterval(() => {
      const currentIndex = scenes.indexOf(activeSceneId as SceneId);
      const nextIndex = (currentIndex + 1) % scenes.length;
      setActiveSceneId(scenes[nextIndex]);
    }, 30000);

    return () => clearInterval(timer);
  }, [autoSceneSwitching, activeSceneId, setActiveSceneId]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if focus is inside an input, textarea, or editable element
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyH':
          e.preventDefault();
          setIsHudVisible((prev) => !prev);
          break;
        case 'KeyL':
          e.preventDefault();
          toggleLibrary();
          break;
        case 'KeyQ':
          e.preventDefault();
          toggleQueue();
          break;
        case 'KeyN':
          e.preventDefault();
          playNext();
          break;
        case 'KeyB':
          e.preventDefault();
          playPrevious();
          break;
        case 'KeyS':
          e.preventDefault();
          toggleShuffle();
          break;
        case 'Digit1':
        case 'Numpad1':
          e.preventDefault();
          setActiveSceneId('neon-tunnel');
          break;
        case 'Digit2':
        case 'Numpad2':
          e.preventDefault();
          setActiveSceneId('particle-universe');
          break;
        case 'Digit3':
        case 'Numpad3':
          e.preventDefault();
          setActiveSceneId('synthwave-horizon');
          break;
        case 'Digit4':
        case 'Numpad4':
          e.preventDefault();
          setActiveSceneId('ferrofluid');
          break;
        case 'Digit5':
        case 'Numpad5':
          e.preventDefault();
          setActiveSceneId('voxel-matrix');
          break;
        case 'Digit6':
        case 'Numpad6':
          e.preventDefault();
          setActiveSceneId('waveform-ridgelines');
          break;
        case 'KeyR':
          e.preventDefault();
          resetToDefaults();
          break;
        case 'KeyP':
          e.preventDefault();
          toggleAnimationPause();
          break;
        case 'KeyF':
          e.preventDefault();
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (currentTrack) {
            seek(Math.max(0, currentTime - 5));
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (currentTrack) {
            seek(currentTime + 5);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay,
    toggleMute,
    seek,
    currentTime,
    currentTrack,
    setActiveSceneId,
    resetToDefaults,
    toggleAnimationPause,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleLibrary,
    toggleQueue
  ]);

  // Window-level drag and drop
  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.types.includes('Files')) {
        setIsWindowDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        setIsWindowDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsWindowDragging(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const ids = await importFiles(e.dataTransfer.files);
        if (ids.length > 0 && !currentTrack) {
          await playTrack(ids[0]);
        }
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [importFiles, playTrack, currentTrack]);

  return (
    <div className={`${styles.appLayout} ${isWindowDragging ? styles.windowDragActive : ''}`}>
      {/* Notifications / Alerts */}
      <ErrorAlert />

      {/* Music Library & Playlist Management Overlay */}
      <LibraryView />

      {/* Up Next Playback Queue Drawer */}
      <QueueDrawer />

      {/* Cyberpunk Top Header */}
      {isHudVisible && (
        <Header
          isHudVisible={isHudVisible}
          onToggleHud={() => setIsHudVisible((prev) => !prev)}
        />
      )}

      {/* Floating Restore UI Button when HUD is hidden */}
      {!isHudVisible && (
        <button
          type="button"
          onClick={() => setIsHudVisible(true)}
          className={styles.floatingShowHudBtn}
          title="Show UI (H)"
          aria-label="Show UI"
          id="btn-show-hud"
        >
          <Eye size={15} />
          <span>Show UI</span>
        </button>
      )}

      {/* Main 3D Stage & Center Dropzone */}
      <div className={styles.mainStage}>
        <ViewportContainer isHudVisible={isHudVisible} />
        <FileDropzone />
        <SidePanel isHudVisible={isHudVisible} />
      </div>

      {/* Bottom Audio Player Bar - Always mounted to keep audio playback alive */}
      <AudioPlayer isHudVisible={isHudVisible} />
    </div>
  );
};

export default App;
