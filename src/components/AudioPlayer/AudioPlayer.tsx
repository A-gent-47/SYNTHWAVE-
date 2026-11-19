import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1,
  Disc,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  ListMusic,
  Library
} from 'lucide-react';
import { useAudioStore } from '../../store/audioStore';
import { usePlaylistStore } from '../../store/playlistStore';
import { formatTime, formatBytes } from '../../utils/audioUtils';
import { AudioEngine } from '../../audio/AudioEngine';
import styles from './AudioPlayer.module.css';

interface AudioPlayerProps {
  isHudVisible?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ isHudVisible = true }) => {
  const {
    currentTrack,
    playbackState,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    setCurrentTime,
    setDuration,
    setPlaybackState,
    setError
  } = useAudioStore();

  const {
    shuffle,
    repeatMode,
    toggleShuffle,
    cycleRepeatMode,
    playNext,
    playPrevious,
    queue,
    toggleQueue,
    isQueueOpen,
    toggleLibrary,
    isLibraryOpen
  } = usePlaylistStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const scrubberContainerRef = useRef<HTMLDivElement | null>(null);
  const [isSeekingLocally, setIsSeekingLocally] = useState(false);
  const [localSeekTime, setLocalSeekTime] = useState(0);

  // Connect AudioEngine to HTMLAudioElement
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      AudioEngine.getInstance().connectAudioElement(audioRef.current).catch((err) => {
        console.warn('AudioEngine connection warning:', err);
      });
    }
  }, [currentTrack]);

  // Sync volume & mute to HTMLAudioElement
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Sync loop to HTMLAudioElement (active when repeatMode is 'one')
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = repeatMode === 'one';
    }
  }, [repeatMode]);

  // Sync playback state with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (playbackState === 'playing') {
      if (audio.paused) {
        const playPromise = audio.play();
        playPromiseRef.current = playPromise;

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              playPromiseRef.current = null;
            })
            .catch((err: unknown) => {
              playPromiseRef.current = null;
              const error = err as Error;

              // Ignore AbortError caused by rapid track switching, pause interruption, or new load
              if (error.name === 'AbortError' || error.message?.includes('interrupted')) {
                return;
              }

              // If browser blocked autoplay, notify user gracefully
              if (error.name === 'NotAllowedError') {
                setError('Browser prevented autoplay. Click anywhere or press Space to play.');
                setPlaybackState('paused');
              } else {
                setError(`Playback error: ${error.message}`);
                setPlaybackState('error');
              }
            });
        }
      }
    } else if (playbackState === 'paused' && !audio.paused) {
      if (playPromiseRef.current) {
        // Wait for in-flight play() to resolve before calling pause() to prevent AbortError
        playPromiseRef.current
          .then(() => {
            if (useAudioStore.getState().playbackState === 'paused' && audioRef.current && !audioRef.current.paused) {
              audioRef.current.pause();
            }
          })
          .catch(() => {
            // In-flight play already aborted or failed
          });
      } else {
        audio.pause();
      }
    }
  }, [playbackState, currentTrack, setError, setPlaybackState]);

  // Handle audio time updates
  const handleTimeUpdate = () => {
    if (audioRef.current && !isSeekingLocally) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const audioDuration = audioRef.current.duration;
      if (isFinite(audioDuration) && audioDuration > 0) {
        setDuration(audioDuration);

        // Sync duration to playlist track if it had 0
        const cur = useAudioStore.getState().currentTrack;
        if (cur?.id) {
          const plState = usePlaylistStore.getState();
          const target = plState.tracks[cur.id];
          if (target && target.duration === 0) {
            usePlaylistStore.setState({
              tracks: {
                ...plState.tracks,
                [cur.id]: { ...target, duration: audioDuration }
              }
            });
          }
        }
      }
      // Note: We deliberately preserve the active playbackState instead of forcing 'paused',
      // preventing AbortError when transitioning between playlist tracks or auto-advancing.
    }
  };

  const handleEnded = () => {
    if (repeatMode === 'one') {
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err: unknown) => {
            const error = err as Error;
            if (error.name !== 'AbortError' && !error.message?.includes('interrupted')) {
              console.warn('Repeat one playback warning:', error);
            }
          });
        }
      }
    } else {
      // Auto-advance to next track in playlist/queue
      playNext(true);
    }
  };

  const handleAudioError = () => {
    if (currentTrack) {
      setError(`Audio decode error: unable to play "${currentTrack.name}". The file may be corrupted.`);
      setPlaybackState('error');
    }
  };

  // Skip 5 seconds backward / forward
  const handleSkip = (seconds: number) => {
    if (!audioRef.current || !currentTrack) return;
    const target = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration || 0));
    audioRef.current.currentTime = target;
    seek(target);
  };

  // Scrubber Seeking calculation
  const calculateSeekTime = useCallback((clientX: number): number => {
    if (!scrubberContainerRef.current || !duration) return 0;
    const rect = scrubberContainerRef.current.getBoundingClientRect();
    const progress = Math.max(0, Math.min((clientX - rect.left) / rect.width, 1));
    return progress * duration;
  }, [duration]);

  const handleScrubberMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentTrack || !duration) return;
    setIsSeekingLocally(true);
    const targetTime = calculateSeekTime(e.clientX);
    setLocalSeekTime(targetTime);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const time = calculateSeekTime(moveEvent.clientX);
      setLocalSeekTime(time);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const finalTime = calculateSeekTime(upEvent.clientX);
      if (audioRef.current) {
        audioRef.current.currentTime = finalTime;
      }
      seek(finalTime);
      setIsSeekingLocally(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Compute progress percentage for bar display
  const displayTime = isSeekingLocally ? localSeekTime : currentTime;
  const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

  // Format track name extension
  const getFormatBadge = () => {
    if (!currentTrack) return 'AUDIO';
    const parts = currentTrack.name.split('.');
    return parts.length > 1 ? parts.pop()?.toUpperCase() : 'WAV';
  };

  return (
    <>
      {/* Hidden HTML5 Audio Element: ALWAYS MOUNTED so audio playback never stops */}
      <audio
        ref={audioRef}
        src={currentTrack ? currentTrack.url : undefined}
        onPlay={() => AudioEngine.getInstance().resume().catch(() => {})}
        onPlaying={() => AudioEngine.getInstance().resume().catch(() => {})}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleAudioError}
        preload="auto"
      />


      {/* Visible footer dock */}
      {isHudVisible && (
        <footer className={styles.playerContainer} role="region" aria-label="Audio player controls">
          {/* Top Scrubber Track */}
      <div
        ref={scrubberContainerRef}
        className={styles.scrubberContainer}
        onMouseDown={handleScrubberMouseDown}
        role="slider"
        aria-label="Seek track position"
        aria-valuemin={0}
        aria-valuemax={duration || 100}
        aria-valuenow={displayTime}
        aria-valuetext={`${formatTime(displayTime)} of ${formatTime(duration)}`}
        tabIndex={currentTrack ? 0 : -1}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') handleSkip(-5);
          if (e.key === 'ArrowRight') handleSkip(5);
        }}
      >
        <div className={styles.scrubberTrack}>
          <div
            className={styles.scrubberFill}
            style={{ width: `${progressPercent}%` }}
          >
            <div className={styles.scrubberThumb} />
          </div>
        </div>
      </div>

      <div className={styles.controlsRow}>
        {/* Left: Track Information */}
        <div className={styles.trackInfo}>
          <div className={`${styles.discIcon} ${playbackState === 'playing' ? styles.discSpinning : ''}`}>
            <Disc size={22} />
          </div>

          <div className={styles.trackDetails}>
            <span className={styles.trackTitle} title={currentTrack?.name || 'No Track Loaded'}>
              {currentTrack ? currentTrack.name : 'NO TRACK LOADED'}
            </span>
            <div className={styles.trackMetaRow}>
              {currentTrack?.isDemo ? (
                <span className={styles.demoBadge}>80S DEMO</span>
              ) : (
                <span className={styles.formatBadge}>{getFormatBadge()}</span>
              )}
              <span className={styles.trackSize}>
                {currentTrack ? formatBytes(currentTrack.size) : '0 MB'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Playback Controls */}
        <div className={styles.playbackControls}>
          <div className={styles.buttonsGroup}>
            {/* Shuffle Toggle */}
            <button
              type="button"
              onClick={toggleShuffle}
              className={`${styles.secondaryControl} ${shuffle ? styles.secondaryControlCyan : ''}`}
              title={shuffle ? 'Shuffle: On' : 'Shuffle: Off'}
              aria-label="Toggle shuffle"
              id="btn-shuffle-toggle"
            >
              <Shuffle size={16} />
            </button>

            {/* Previous Track */}
            <button
              type="button"
              onClick={playPrevious}
              disabled={queue.length === 0 && !currentTrack}
              className={styles.secondaryControl}
              title="Previous Track (P)"
              aria-label="Previous track"
              id="btn-prev-track"
            >
              <SkipBack size={16} />
            </button>

            {/* Rewind 5s */}
            <button
              type="button"
              onClick={() => handleSkip(-5)}
              disabled={!currentTrack}
              className={styles.secondaryControl}
              title="Seek backward 5 seconds (Left Arrow)"
              aria-label="Seek backward 5 seconds"
              id="btn-seek-back"
            >
              <RotateCcw size={15} />
            </button>

            {/* Play / Pause Primary */}
            <button
              type="button"
              onClick={() => {
                AudioEngine.getInstance().init().catch(() => {});
                togglePlay();
              }}
              disabled={!currentTrack || playbackState === 'loading'}
              className={styles.playPauseButton}
              title={playbackState === 'playing' ? 'Pause (Space)' : 'Play (Space)'}
              aria-label={playbackState === 'playing' ? 'Pause' : 'Play'}
              id="btn-play-pause"
            >
              {playbackState === 'playing' ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: '3px' }} />}
            </button>

            {/* Forward 5s */}
            <button
              type="button"
              onClick={() => handleSkip(5)}
              disabled={!currentTrack}
              className={styles.secondaryControl}
              title="Seek forward 5 seconds (Right Arrow)"
              aria-label="Seek forward 5 seconds"
              id="btn-seek-forward"
            >
              <RotateCw size={15} />
            </button>

            {/* Next Track */}
            <button
              type="button"
              onClick={() => playNext(false)}
              disabled={queue.length === 0 && !currentTrack}
              className={styles.secondaryControl}
              title="Next Track (N)"
              aria-label="Next track"
              id="btn-next-track"
            >
              <SkipForward size={16} />
            </button>

            {/* Repeat Mode Toggle */}
            <button
              type="button"
              onClick={cycleRepeatMode}
              className={`${styles.secondaryControl} ${styles.buttonWithBadge} ${repeatMode !== 'off' ? styles.secondaryControlActive : ''}`}
              title={
                repeatMode === 'one'
                  ? 'Repeat: Current Track'
                  : repeatMode === 'all'
                  ? 'Repeat: Entire Playlist'
                  : 'Repeat: Off'
              }
              aria-label="Cycle repeat mode"
              id="btn-repeat-toggle"
            >
              {repeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
              {repeatMode === 'one' && <span className={styles.repeatOneBadge}>1</span>}
            </button>
          </div>

          {/* Timecode display */}
          <div className={styles.timeDisplay}>
            <span className={styles.timeCurrent}>{formatTime(displayTime)}</span>
            <span> / </span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Volume & Utilities */}
        <div className={styles.utilityControls}>
          {/* Library View Toggle */}
          <button
            type="button"
            onClick={() => toggleLibrary()}
            className={`${styles.secondaryControl} ${isLibraryOpen ? styles.secondaryControlCyan : ''}`}
            title={isLibraryOpen ? 'Close Library (L)' : 'Open Music Library (L)'}
            aria-label="Toggle music library"
            id="btn-toggle-library"
          >
            <Library size={16} />
          </button>

          {/* Queue Drawer Toggle */}
          <button
            type="button"
            onClick={() => toggleQueue()}
            className={`${styles.secondaryControl} ${styles.buttonWithBadge} ${isQueueOpen ? styles.secondaryControlActive : ''}`}
            title={isQueueOpen ? 'Close Queue (Q)' : 'Open Queue (Q)'}
            aria-label="Toggle playback queue"
            id="btn-toggle-queue"
          >
            <ListMusic size={16} />
            {queue.length > 0 && <span className={styles.queueBadge}>{queue.length}</span>}
          </button>

          <div className={styles.volumeGroup}>
            <button
              type="button"
              onClick={toggleMute}
              className={styles.volumeButton}
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
              id="btn-mute-toggle"
            >
              {isMuted || volume === 0 ? (
                <VolumeX size={18} />
              ) : volume < 0.5 ? (
                <Volume1 size={18} />
              ) : (
                <Volume2 size={18} />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className={styles.volumeSlider}
              aria-label="Audio volume"
              id="slider-volume"
            />

            <span className={styles.volumePercent}>
              {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
            </span>
          </div>
        </div>
      </div>
    </footer>
      )}
    </>
  );
};
