import React, { useRef } from 'react';
import { Activity, Upload, Sparkles, Trash2, Eye, EyeOff, Library } from 'lucide-react';
import { useAudioStore } from '../../store/audioStore';
import { usePlaylistStore } from '../../store/playlistStore';
import styles from './Header.module.css';

interface HeaderProps {
  isHudVisible: boolean;
  onToggleHud: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isHudVisible, onToggleHud }) => {
  const {
    currentTrack,
    playbackState,
    loadDemoTrack,
    clearTrack
  } = useAudioStore();

  const { isLibraryOpen, toggleLibrary, importFiles, playTrack } = usePlaylistStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const ids = await importFiles(e.target.files);
      if (ids.length > 0 && !currentTrack) {
        await playTrack(ids[0]);
      }
      e.target.value = '';
    }
  };

  const getStatusText = () => {
    switch (playbackState) {
      case 'playing':
        return 'Streaming';
      case 'paused':
        return 'Paused';
      case 'loading':
        return 'Buffering';
      case 'error':
        return 'Audio Error';
      default:
        return 'Standby';
    }
  };

  const getStatusDotClass = () => {
    switch (playbackState) {
      case 'playing':
        return styles.statusDotPlaying;
      case 'paused':
        return styles.statusDotPaused;
      case 'loading':
        return styles.statusDotLoading;
      case 'error':
        return styles.statusDotError;
      default:
        return '';
    }
  };

  return (
    <header className={styles.header} role="banner">
      <div className={styles.leftSection}>
        <div className={styles.logoContainer}>
          <Activity className={styles.logoIcon} size={18} aria-hidden="true" />
          <span className={styles.logoTitle}>SYNTHWAVE</span>
        </div>

        <div className={styles.statusBadge} aria-live="polite">
          <span className={`${styles.statusDot} ${getStatusDotClass()}`} />
          <span>{getStatusText()}</span>
        </div>
      </div>

      <div className={styles.rightSection}>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a"
          multiple
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          id="header-file-input"
          aria-label="Upload local audio file"
        />

        {/* Music Library & Playlist View Trigger */}
        <button
          type="button"
          onClick={() => toggleLibrary()}
          className={`${styles.actionButton} ${isLibraryOpen ? styles.actionButtonActive : ''}`}
          title={isLibraryOpen ? 'Close Library (L)' : 'Music Library & Playlists (L)'}
          id="btn-header-library"
        >
          <Library size={15} />
          <span>{isLibraryOpen ? 'Close Library' : 'Library'}</span>
        </button>

        {/* 1-Click Synthwave Demo Generator */}
        <button
          type="button"
          onClick={() => loadDemoTrack()}
          className={styles.actionButton}
          title="Procedurally generate an authentic 80s Synthwave demo track"
          id="btn-demo-synth"
        >
          <Sparkles size={15} />
          <span>Demo Track</span>
        </button>

        {/* File Upload Trigger */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={styles.actionButton}
          title="Import local audio files (MP3, WAV, FLAC, OGG)"
          id="btn-upload-audio"
        >
          <Upload size={15} />
          <span>Import Audio</span>
        </button>

        {/* Clear Track */}
        {currentTrack && (
          <button
            type="button"
            onClick={clearTrack}
            className={`${styles.actionButton} ${styles.clearButton}`}
            title="Eject loaded track"
            id="btn-clear-track"
          >
            <Trash2 size={15} />
            <span>Eject</span>
          </button>
        )}

        {/* Toggle HUD / Clean Immersion View */}
        <button
          type="button"
          onClick={onToggleHud}
          className={styles.iconOnlyButton}
          title={isHudVisible ? 'Hide HUD controls (H)' : 'Show HUD controls (H)'}
          aria-label={isHudVisible ? 'Hide HUD' : 'Show HUD'}
          id="btn-toggle-hud"
        >
          {isHudVisible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </header>
  );
};
