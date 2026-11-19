export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface AudioTrackMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  duration: number;
  sampleRate?: number;
  isDemo?: boolean;
}

export interface AudioPlayerState {
  // Current track
  currentTrack: AudioTrackMetadata | null;
  playbackState: PlaybackState;
  
  // Audio parameters
  currentTime: number;
  duration: number;
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
  isLooping: boolean;
  
  // UI / Status
  errorMessage: string | null;
  isDraggingFile: boolean;
  
  // Actions
  loadTrack: (file: File) => Promise<void>;
  loadDemoTrack: () => Promise<void>;
  clearTrack: () => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleLoop: () => void;
  setPlaybackState: (state: PlaybackState) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setError: (message: string | null) => void;
  setIsDraggingFile: (isDragging: boolean) => void;
}
