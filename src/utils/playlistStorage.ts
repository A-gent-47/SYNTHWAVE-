import {
  LibraryTrack,
  Playlist,
  RepeatMode,
  SerializedLibraryState,
  SerializedLibraryTrack,
  SerializedPlaylist
} from '../types/playlist';

const STORAGE_KEY = 'synthwave_music_library_v1';

export interface LoadedLibraryData {
  tracks: Record<string, LibraryTrack>;
  playlists: Playlist[];
  settings: {
    shuffle: boolean;
    repeatMode: RepeatMode;
    activePlaylistId: string;
  };
}

const DEFAULT_PLAYLIST: Playlist = {
  id: 'synthwave-favorites',
  name: '⚡ Neon Classics',
  description: 'Handpicked retro cyberpunk synth favorites',
  trackIds: [],
  createdAt: Date.now(),
  updatedAt: Date.now()
};

/**
 * Saves library metadata, playlists, and settings to localStorage.
 * Audio blobs and temporary Object URLs are NEVER stored.
 */
export function saveLibraryToStorage(
  tracks: Record<string, LibraryTrack>,
  playlists: Playlist[],
  settings: {
    shuffle: boolean;
    repeatMode: RepeatMode;
    activePlaylistId: string;
  }
): boolean {
  try {
    const serializedTracks: SerializedLibraryTrack[] = Object.values(tracks).map((t) => ({
      id: t.id,
      name: t.name,
      title: t.title,
      artist: t.artist,
      album: t.album,
      duration: t.duration,
      size: t.size,
      type: t.type,
      isDemo: t.isDemo,
      isFavourite: t.isFavourite,
      addedAt: t.addedAt
    }));

    const serializedPlaylists: SerializedPlaylist[] = playlists.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      trackIds: [...p.trackIds],
      isSystem: p.isSystem,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    const state: SerializedLibraryState = {
      version: 1,
      tracks: serializedTracks,
      playlists: serializedPlaylists,
      settings
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.warn('Failed to save music library to localStorage:', err);
    return false;
  }
}

/**
 * Loads library metadata, playlists, and settings from localStorage.
 * Local files that do not have an in-memory File/Blob handle are flagged as `isUnavailable: true`.
 */
export function loadLibraryFromStorage(): LoadedLibraryData {
  const defaultState: LoadedLibraryData = {
    tracks: {},
    playlists: [DEFAULT_PLAYLIST],
    settings: {
      shuffle: false,
      repeatMode: 'all',
      activePlaylistId: 'all'
    }
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;

    const parsed: SerializedLibraryState = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return defaultState;

    const tracks: Record<string, LibraryTrack> = {};
    if (Array.isArray(parsed.tracks)) {
      for (const st of parsed.tracks) {
        tracks[st.id] = {
          ...st,
          url: '', // Object URL must not be restored from storage
          // Local files require reselection after browser restart because browser security revokes file descriptors
          isUnavailable: !st.isDemo
        };
      }
    }

    const playlists: Playlist[] = Array.isArray(parsed.playlists) && parsed.playlists.length > 0
      ? parsed.playlists
      : [DEFAULT_PLAYLIST];

    const settings = {
      shuffle: Boolean(parsed.settings?.shuffle),
      repeatMode: parsed.settings?.repeatMode || 'all',
      activePlaylistId: parsed.settings?.activePlaylistId || 'all'
    };

    return { tracks, playlists, settings };
  } catch (err) {
    console.warn('Failed to parse music library from localStorage, using default:', err);
    return defaultState;
  }
}
