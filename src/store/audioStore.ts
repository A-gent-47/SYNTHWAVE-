import { create } from 'zustand';
import { AudioPlayerState, AudioTrackMetadata, PlaybackState } from '../types/audio';
import { validateAudioFile, generateSynthwaveDemoTrack } from '../utils/audioUtils';

let previousUrl: string | null = null;

export const useAudioStore = create<AudioPlayerState>((set, get) => ({
  currentTrack: null,
  playbackState: 'idle',
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  isLooping: false,
  errorMessage: null,
  isDraggingFile: false,

  loadTrack: async (file: File) => {
    // 1. Validation
    const validation = validateAudioFile(file);
    if (!validation.isValid) {
      set({
        errorMessage: validation.error || 'Invalid audio file',
        playbackState: 'error'
      });
      return;
    }

    // 2. Cleanup previous URL if needed
    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
      previousUrl = null;
    }

    set({ playbackState: 'loading', errorMessage: null });

    try {
      const url = URL.createObjectURL(file);
      previousUrl = url;

      const track: AudioTrackMetadata = {
        id: `track-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'audio/mpeg',
        url,
        duration: 0,
        isDemo: false
      };

      set({
        currentTrack: track,
        playbackState: 'paused',
        currentTime: 0,
        duration: 0,
        errorMessage: null
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to read audio file';
      set({ errorMessage: msg, playbackState: 'error' });
    }
  },

  loadDemoTrack: async () => {
    set({ playbackState: 'loading', errorMessage: null });
    try {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
        previousUrl = null;
      }

      const blob = await generateSynthwaveDemoTrack();
      const url = URL.createObjectURL(blob);
      previousUrl = url;

      const track: AudioTrackMetadata = {
        id: `demo-${Date.now()}`,
        name: 'CYBER-ARPEGGIO // Synthwave 120BPM Demo',
        size: blob.size,
        type: 'audio/wav',
        url,
        duration: 8.0,
        isDemo: true
      };

      set({
        currentTrack: track,
        playbackState: 'paused',
        currentTime: 0,
        duration: 8.0,
        errorMessage: null
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate demo synth track';
      set({ errorMessage: msg, playbackState: 'error' });
    }
  },

  clearTrack: () => {
    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
      previousUrl = null;
    }
    set({
      currentTrack: null,
      playbackState: 'idle',
      currentTime: 0,
      duration: 0,
      errorMessage: null
    });
  },

  play: () => {
    const { currentTrack } = get();
    if (!currentTrack) return;
    set({ playbackState: 'playing' });
  },

  pause: () => {
    const { currentTrack } = get();
    if (!currentTrack) return;
    set({ playbackState: 'paused' });
  },

  togglePlay: () => {
    const { playbackState, currentTrack } = get();
    if (!currentTrack) return;
    if (playbackState === 'playing') {
      set({ playbackState: 'paused' });
    } else {
      set({ playbackState: 'playing' });
    }
  },

  seek: (time: number) => {
    const { duration } = get();
    const clampedTime = Math.max(0, Math.min(time, duration || 0));
    set({ currentTime: clampedTime });
  },

  setVolume: (volume: number) => {
    const clampedVol = Math.max(0, Math.min(volume, 1.0));
    set({
      volume: clampedVol,
      isMuted: clampedVol === 0 ? true : get().isMuted && clampedVol > 0 ? false : get().isMuted
    });
  },

  toggleMute: () => {
    set(state => ({ isMuted: !state.isMuted }));
  },

  toggleLoop: () => {
    set(state => ({ isLooping: !state.isLooping }));
  },

  setPlaybackState: (state: PlaybackState) => {
    set({ playbackState: state });
  },

  setCurrentTime: (time: number) => {
    set({ currentTime: time });
  },

  setDuration: (duration: number) => {
    set({ duration: Math.max(0, duration) });
  },

  setError: (message: string | null) => {
    set({ errorMessage: message, playbackState: message ? 'error' : get().playbackState });
  },

  setIsDraggingFile: (isDragging: boolean) => {
    set({ isDraggingFile: isDragging });
  }
}));
