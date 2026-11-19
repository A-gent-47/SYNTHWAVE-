import React, { useRef, useState } from 'react';
import { UploadCloud, Music, Sparkles, ShieldCheck } from 'lucide-react';
import { useAudioStore } from '../../store/audioStore';
import { usePlaylistStore } from '../../store/playlistStore';
import styles from './FileDropzone.module.css';

export const FileDropzone: React.FC = () => {
  const { currentTrack, loadDemoTrack, playbackState } = useAudioStore();
  const { importFiles, playTrack } = usePlaylistStore();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If a track is already loaded, don't show the full dropzone card unless dragging
  if (currentTrack && !isDragOver) {
    return null;
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const ids = await importFiles(e.dataTransfer.files);
      if (ids.length > 0) {
        await playTrack(ids[0]);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const ids = await importFiles(e.target.files);
      if (ids.length > 0) {
        await playTrack(ids[0]);
      }
      e.target.value = '';
    }
  };

  return (
    <div
      className={styles.overlayContainer}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
        id="dropzone-file-input"
        aria-label="Upload audio files"
      />

      <div className={`${styles.dropzoneCard} ${isDragOver ? styles.dropzoneCardHover : ''}`}>
        <div className={styles.iconWrapper}>
          {isDragOver ? <UploadCloud size={24} /> : <Music size={24} />}
        </div>

        <div className={styles.textContainer}>
          <h2 className={styles.title}>
            {isDragOver ? 'Release to load audio' : 'Drop audio files here'}
          </h2>
          <p className={styles.description}>
            Import any local audio file to start visualizer, or try our procedural demo track.
          </p>
        </div>

        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.selectButton}
            onClick={() => fileInputRef.current?.click()}
            disabled={playbackState === 'loading'}
            id="dropzone-select-btn"
          >
            <UploadCloud size={14} />
            <span>Choose File</span>
          </button>

          <button
            type="button"
            className={styles.demoButton}
            onClick={() => loadDemoTrack()}
            disabled={playbackState === 'loading'}
            id="dropzone-demo-btn"
          >
            <Sparkles size={14} />
            <span>Demo Track</span>
          </button>
        </div>

        <div className={styles.supportedFormats}>
          <span className={styles.formatLabel}>Formats:</span>
          <span className={styles.formatTag}>MP3</span>
          <span className={styles.formatTag}>WAV</span>
          <span className={styles.formatTag}>FLAC</span>
          <span className={styles.formatTag}>OGG</span>
          <span className={styles.formatTag}>M4A</span>
        </div>

        <div className={styles.privacyNotice}>
          <ShieldCheck size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
          Audio stays local and never leaves your browser
        </div>
      </div>
    </div>
  );
};
