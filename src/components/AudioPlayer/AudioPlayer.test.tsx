import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AudioPlayer } from './AudioPlayer';
import { useAudioStore } from '../../store/audioStore';

describe('AudioPlayer Component', () => {
  beforeEach(() => {
    useAudioStore.getState().clearTrack();
  });

  it('renders audio player controls with idle state', () => {
    render(<AudioPlayer />);
    expect(screen.getByText('NO TRACK LOADED')).toBeInTheDocument();
    expect(screen.getAllByText('00:00')).toHaveLength(2);

    const playBtn = screen.getByRole('button', { name: /^play$/i });
    expect(playBtn).toBeDisabled();
  });

  it('enables play button and updates track details when track is loaded', async () => {
    const file = new File(['mock content'], 'synth_blast.mp3', { type: 'audio/mpeg' });
    await useAudioStore.getState().loadTrack(file);

    render(<AudioPlayer />);
    expect(screen.getByText('synth_blast.mp3')).toBeInTheDocument();

    const playBtn = screen.getByRole('button', { name: /^play$/i });
    expect(playBtn).not.toBeDisabled();
  });

  it('toggles mute button when clicked', () => {
    render(<AudioPlayer />);
    const muteBtn = screen.getByRole('button', { name: /mute audio/i });
    fireEvent.click(muteBtn);

    expect(useAudioStore.getState().isMuted).toBe(true);
  });

  it('renders previous, next, shuffle, repeat, and queue buttons', () => {
    render(<AudioPlayer />);
    expect(screen.getByRole('button', { name: /previous track/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next track/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /toggle shuffle/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cycle repeat mode/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /toggle playback queue/i })).toBeInTheDocument();
  });

  it('keeps audio element mounted in DOM even when isHudVisible is false', () => {
    const { container } = render(<AudioPlayer isHudVisible={false} />);
    const audioElement = container.querySelector('audio');
    expect(audioElement).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /audio player controls/i })).not.toBeInTheDocument();
  });

  it('preserves active playing state when onLoadedMetadata fires', async () => {
    const file = new File(['mock content'], 'test_song.mp3', { type: 'audio/mpeg' });
    await useAudioStore.getState().loadTrack(file);
    useAudioStore.getState().play();
    expect(useAudioStore.getState().playbackState).toBe('playing');

    const { container } = render(<AudioPlayer />);
    const audioElement = container.querySelector('audio')!;

    // Simulate loadedmetadata event
    Object.defineProperty(audioElement, 'duration', { value: 180, configurable: true });
    fireEvent.loadedMetadata(audioElement);

    // Playback state must remain 'playing' and not get forced to 'paused'
    expect(useAudioStore.getState().playbackState).toBe('playing');
    expect(useAudioStore.getState().duration).toBe(180);
  });
});
