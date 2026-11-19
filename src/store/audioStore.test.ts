import { describe, it, expect, beforeEach } from 'vitest';
import { useAudioStore } from './audioStore';

describe('audioStore', () => {
  beforeEach(() => {
    useAudioStore.getState().clearTrack();
  });

  it('initializes with default audio player state', () => {
    const state = useAudioStore.getState();
    expect(state.currentTrack).toBeNull();
    expect(state.playbackState).toBe('idle');
    expect(state.volume).toBe(0.8);
    expect(state.isMuted).toBe(false);
    expect(state.isLooping).toBe(false);
    expect(state.currentTime).toBe(0);
    expect(state.duration).toBe(0);
  });

  it('loads a valid track and sets track metadata', async () => {
    const file = new File(['dummy audio content'], 'laser_grid.mp3', { type: 'audio/mpeg' });
    await useAudioStore.getState().loadTrack(file);

    const state = useAudioStore.getState();
    expect(state.currentTrack).not.toBeNull();
    expect(state.currentTrack?.name).toBe('laser_grid.mp3');
    expect(state.playbackState).toBe('paused');
    expect(state.errorMessage).toBeNull();
  });

  it('sets error state for invalid files', async () => {
    const invalidFile = new File(['text'], 'readme.txt', { type: 'text/plain' });
    await useAudioStore.getState().loadTrack(invalidFile);

    const state = useAudioStore.getState();
    expect(state.playbackState).toBe('error');
    expect(state.errorMessage).toContain('Unsupported format');
  });

  it('manages volume and mute toggles', () => {
    const store = useAudioStore.getState();
    store.setVolume(0.5);
    expect(useAudioStore.getState().volume).toBe(0.5);

    store.toggleMute();
    expect(useAudioStore.getState().isMuted).toBe(true);

    store.toggleMute();
    expect(useAudioStore.getState().isMuted).toBe(false);
  });

  it('toggles loop state', () => {
    const store = useAudioStore.getState();
    expect(store.isLooping).toBe(false);

    store.toggleLoop();
    expect(useAudioStore.getState().isLooping).toBe(true);
  });

  it('manages playback state on togglePlay with track loaded', async () => {
    const file = new File(['dummy audio content'], 'track.mp3', { type: 'audio/mpeg' });
    await useAudioStore.getState().loadTrack(file);

    useAudioStore.getState().togglePlay();
    expect(useAudioStore.getState().playbackState).toBe('playing');

    useAudioStore.getState().togglePlay();
    expect(useAudioStore.getState().playbackState).toBe('paused');
  });

  it('seeks to target time bounded by duration', () => {
    useAudioStore.getState().setDuration(120);
    useAudioStore.getState().seek(45);
    expect(useAudioStore.getState().currentTime).toBe(45);

    // Clamps beyond duration
    useAudioStore.getState().seek(200);
    expect(useAudioStore.getState().currentTime).toBe(120);

    // Clamps below zero
    useAudioStore.getState().seek(-10);
    expect(useAudioStore.getState().currentTime).toBe(0);
  });
});
