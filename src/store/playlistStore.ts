import { create } from 'zustand';
import {
  LibraryTrack,
  Playlist,
  RepeatMode,
  SortField,
  SortOrder
} from '../types/playlist';
import { useAudioStore } from './audioStore';
import { parseAudioMetadata, generateFileTrackId } from '../utils/audioMetadata';
import { loadLibraryFromStorage, saveLibraryToStorage } from '../utils/playlistStorage';
import { validateAudioFile, generateSynthwaveDemoTrack } from '../utils/audioUtils';

export interface PlaylistState {
  // Library Data
  tracks: Record<string, LibraryTrack>;
  playlists: Playlist[];
  activePlaylistId: string; // 'all' | 'favourites' | playlist.id

  // Playback & Queue
  queue: string[]; // List of track IDs in upcoming playback order
  currentQueueIndex: number;
  shuffle: boolean;
  repeatMode: RepeatMode;

  // Search & Filtering
  searchQuery: string;
  sortField: SortField;
  sortOrder: SortOrder;

  // UI States
  isLibraryOpen: boolean;
  isQueueOpen: boolean;

  // Actions — Library
  importFiles: (files: FileList | File[], targetPlaylistId?: string) => Promise<string[]>;
  addDemoTrack: () => Promise<string>;
  relinkTrackFile: (trackId: string, file: File) => Promise<boolean>;
  toggleFavourite: (trackId: string) => void;
  deleteTrackFromLibrary: (trackId: string) => void;

  // Actions — Playlists
  createPlaylist: (name: string, description?: string) => string;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  clearPlaylist: (id: string) => void;
  addTracksToPlaylist: (playlistId: string, trackIds: string[]) => void;
  removeTrackFromPlaylist: (playlistId: string, trackIndex: number) => void;
  reorderPlaylist: (playlistId: string, fromIndex: number, toIndex: number) => void;
  setActivePlaylistId: (id: string) => void;

  // Actions — Playback Navigation
  playTrack: (trackId: string, sourcePlaylistId?: string) => Promise<void>;
  playNext: (isAutoEnd?: boolean) => Promise<void>;
  playPrevious: () => Promise<void>;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;

  // Actions — Queue
  addToQueue: (trackId: string) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;

  // Actions — Search & Sort & View
  setSearchQuery: (query: string) => void;
  setSort: (field: SortField, order?: SortOrder) => void;
  toggleLibrary: (open?: boolean) => void;
  toggleQueue: (open?: boolean) => void;

  // Selector Helpers
  getFilteredTracks: () => LibraryTrack[];
  getActivePlaylist: () => Playlist | null;
  getTrackCount: (playlistId?: string) => number;
  getTotalDuration: (playlistId?: string) => number;
}

// Fisher-Yates non-repeating shuffle helper
function shuffleArray<T>(array: T[], excludeFirstItem?: T): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  // If excludeFirstItem is given, ensure it stays at index 0
  if (excludeFirstItem !== undefined) {
    const idx = arr.indexOf(excludeFirstItem);
    if (idx > -1) {
      arr.splice(idx, 1);
      arr.unshift(excludeFirstItem);
    }
  }
  return arr;
}

// Initial hydration from safe localStorage
const persisted = loadLibraryFromStorage();

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  tracks: persisted.tracks,
  playlists: persisted.playlists,
  activePlaylistId: persisted.settings.activePlaylistId || 'all',

  queue: [],
  currentQueueIndex: -1,
  shuffle: persisted.settings.shuffle,
  repeatMode: persisted.settings.repeatMode,

  searchQuery: '',
  sortField: 'addedAt',
  sortOrder: 'desc',

  isLibraryOpen: false,
  isQueueOpen: false,

  importFiles: async (filesInput, targetPlaylistId) => {
    const files = Array.from(filesInput);
    if (files.length === 0) return [];

    const currentTracks = { ...get().tracks };
    const importedIds: string[] = [];

    for (const file of files) {
      const validation = validateAudioFile(file);
      if (!validation.isValid) continue;

      const trackId = generateFileTrackId(file);
      const metadata = parseAudioMetadata(file.name);
      const url = URL.createObjectURL(file);

      const newTrack: LibraryTrack = {
        id: trackId,
        name: file.name,
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        duration: 0,
        size: file.size,
        type: file.type || 'audio/mpeg',
        url,
        file,
        isDemo: false,
        isFavourite: currentTracks[trackId]?.isFavourite || false,
        isUnavailable: false,
        addedAt: currentTracks[trackId]?.addedAt || Date.now()
      };

      currentTracks[trackId] = newTrack;
      importedIds.push(trackId);
    }

    let updatedPlaylists = [...get().playlists];
    if (targetPlaylistId && targetPlaylistId !== 'all' && targetPlaylistId !== 'favourites') {
      updatedPlaylists = updatedPlaylists.map((pl) => {
        if (pl.id === targetPlaylistId) {
          // Add new IDs without duplicating in this playlist
          const combined = [...pl.trackIds];
          for (const id of importedIds) {
            if (!combined.includes(id)) {
              combined.push(id);
            }
          }
          return { ...pl, trackIds: combined, updatedAt: Date.now() };
        }
        return pl;
      });
    }

    set({ tracks: currentTracks, playlists: updatedPlaylists });

    // Sync to persistence
    saveLibraryToStorage(currentTracks, updatedPlaylists, {
      shuffle: get().shuffle,
      repeatMode: get().repeatMode,
      activePlaylistId: get().activePlaylistId
    });

    return importedIds;
  },

  addDemoTrack: async () => {
    try {
      const blob = await generateSynthwaveDemoTrack();
      const demoId = `demo-${Date.now()}`;
      const url = URL.createObjectURL(blob);

      const demoTrack: LibraryTrack = {
        id: demoId,
        name: 'CYBER-ARPEGGIO // Synthwave 120BPM Demo',
        title: 'Cyber Arpeggio (120 BPM)',
        artist: 'Antigravity Sound Lab',
        album: 'Neon Horizon Archives',
        duration: 8.0,
        size: blob.size,
        type: 'audio/wav',
        url,
        isDemo: true,
        isFavourite: false,
        isUnavailable: false,
        addedAt: Date.now()
      };

      const updatedTracks = { ...get().tracks, [demoId]: demoTrack };
      set({ tracks: updatedTracks });

      saveLibraryToStorage(updatedTracks, get().playlists, {
        shuffle: get().shuffle,
        repeatMode: get().repeatMode,
        activePlaylistId: get().activePlaylistId
      });

      return demoId;
    } catch (err) {
      console.error('Failed to add demo track:', err);
      return '';
    }
  },

  relinkTrackFile: async (trackId, file) => {
    const track = get().tracks[trackId];
    if (!track) return false;

    const validation = validateAudioFile(file);
    if (!validation.isValid) return false;

    const url = URL.createObjectURL(file);
    const updatedTrack: LibraryTrack = {
      ...track,
      url,
      file,
      size: file.size,
      type: file.type || track.type,
      isUnavailable: false
    };

    const updatedTracks = { ...get().tracks, [trackId]: updatedTrack };
    set({ tracks: updatedTracks });

    // If currently active track was relinked, update in audioStore
    const activeAudio = useAudioStore.getState().currentTrack;
    if (activeAudio && activeAudio.id === trackId) {
      useAudioStore.getState().loadTrack(file);
    }

    return true;
  },

  toggleFavourite: (trackId) => {
    const track = get().tracks[trackId];
    if (!track) return;

    const updatedTracks = {
      ...get().tracks,
      [trackId]: { ...track, isFavourite: !track.isFavourite }
    };

    set({ tracks: updatedTracks });
    saveLibraryToStorage(updatedTracks, get().playlists, {
      shuffle: get().shuffle,
      repeatMode: get().repeatMode,
      activePlaylistId: get().activePlaylistId
    });
  },

  deleteTrackFromLibrary: (trackId) => {
    const { tracks, playlists, queue } = get();
    if (!tracks[trackId]) return;

    const updatedTracks = { ...tracks };
    delete updatedTracks[trackId];

    // Remove from all playlists
    const updatedPlaylists = playlists.map((pl) => ({
      ...pl,
      trackIds: pl.trackIds.filter((id) => id !== trackId),
      updatedAt: Date.now()
    }));

    // Remove from queue
    const updatedQueue = queue.filter((id) => id !== trackId);

    set({
      tracks: updatedTracks,
      playlists: updatedPlaylists,
      queue: updatedQueue
    });

    saveLibraryToStorage(updatedTracks, updatedPlaylists, {
      shuffle: get().shuffle,
      repeatMode: get().repeatMode,
      activePlaylistId: get().activePlaylistId
    });
  },

  createPlaylist: (name, description) => {
    const trimmed = name.trim() || `Playlist #${get().playlists.length + 1}`;
    const newId = `pl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newPlaylist: Playlist = {
      id: newId,
      name: trimmed,
      description: description?.trim() || '',
      trackIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updatedPlaylists = [...get().playlists, newPlaylist];
    set({ playlists: updatedPlaylists, activePlaylistId: newId });

    saveLibraryToStorage(get().tracks, updatedPlaylists, {
      shuffle: get().shuffle,
      repeatMode: get().repeatMode,
      activePlaylistId: newId
    });

    return newId;
  },

  renamePlaylist: (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const updatedPlaylists = get().playlists.map((pl) => {
      if (pl.id === id) {
        return { ...pl, name: trimmed, updatedAt: Date.now() };
      }
      return pl;
    });

    set({ playlists: updatedPlaylists });
    saveLibraryToStorage(get().tracks, updatedPlaylists, {
      shuffle: get().shuffle,
      repeatMode: get().repeatMode,
      activePlaylistId: get().activePlaylistId
    });
  },

  deletePlaylist: (id) => {
    // Original audio files are NOT deleted from tracks when a playlist is deleted
    const updatedPlaylists = get().playlists.filter((pl) => pl.id !== id);
    const newActiveId = get().activePlaylistId === id ? 'all' : get().activePlaylistId;

    set({ playlists: updatedPlaylists, activePlaylistId: newActiveId });
    saveLibraryToStorage(get().tracks, updatedPlaylists, {
      shuffle: get().shuffle,
      repeatMode: get().repeatMode,
      activePlaylistId: newActiveId
    });
  },

  clearPlaylist: (id) => {
    const updatedPlaylists = get().playlists.map((pl) => {
      if (pl.id === id) {
        return { ...pl, trackIds: [], updatedAt: Date.now() };
      }
      return pl;
    });

    set({ playlists: updatedPlaylists });
    saveLibraryToStorage(get().tracks, updatedPlaylists, {
      shuffle: get().shuffle,
      repeatMode: get().repeatMode,
      activePlaylistId: get().activePlaylistId
    });
  },

  addTracksToPlaylist: (playlistId, trackIds) => {
    const updatedPlaylists = get().playlists.map((pl) => {
      if (pl.id === playlistId) {
        const setIds = new Set(pl.trackIds);
        for (const tid of trackIds) {
          setIds.add(tid);
        }
        return { ...pl, trackIds: Array.from(setIds), updatedAt: Date.now() };
      }
      return pl;
    });

    set({ playlists: updatedPlaylists });
    saveLibraryToStorage(get().tracks, updatedPlaylists, {
      shuffle: get().shuffle,
      repeatMode: get().repeatMode,
      activePlaylistId: get().activePlaylistId
    });
  },

  removeTrackFromPlaylist: (playlistId, trackIndex) => {
    const updatedPlaylists = get().playlists.map((pl) => {
      if (pl.id === playlistId) {
        const newTrackIds = [...pl.trackIds];
        newTrackIds.splice(trackIndex, 1);
        return { ...pl, trackIds: newTrackIds, updatedAt: Date.now() };
      }
      return pl;
    });

    set({ playlists: updatedPlaylists });
    saveLibraryToStorage(get().tracks, updatedPlaylists, {
      shuffle: get().shuffle,
      repeatMode: get().repeatMode,
      activePlaylistId: get().activePlaylistId
    });
  },

  reorderPlaylist: (playlistId, fromIndex, toIndex) => {
    const updatedPlaylists = get().playlists.map((pl) => {
      if (pl.id === playlistId) {
        const newTrackIds = [...pl.trackIds];
        const [moved] = newTrackIds.splice(fromIndex, 1);
        newTrackIds.splice(toIndex, 0, moved);
        return { ...pl, trackIds: newTrackIds, updatedAt: Date.now() };
      }
      return pl;
    });

    set({ playlists: updatedPlaylists });
    saveLibraryToStorage(get().tracks, updatedPlaylists, {
      shuffle: get().shuffle,
      repeatMode: get().repeatMode,
      activePlaylistId: get().activePlaylistId
    });
  },

  setActivePlaylistId: (id) => {
    set({ activePlaylistId: id });
    saveLibraryToStorage(get().tracks, get().playlists, {
      shuffle: get().shuffle,
      repeatMode: get().repeatMode,
      activePlaylistId: id
    });
  },

  playTrack: async (trackId, sourcePlaylistId) => {
    const { tracks, shuffle, playlists } = get();
    const track = tracks[trackId];
    if (!track) return;

    if (track.isUnavailable) {
      useAudioStore.getState().setError(
        `Local file for "${track.title}" is offline. Please reselect the file to play.`
      );
      return;
    }

    // Determine candidate track sequence for the queue
    let candidateIds: string[] = [];
    const targetPlId = sourcePlaylistId || get().activePlaylistId;

    if (targetPlId === 'all') {
      candidateIds = Object.keys(tracks);
    } else if (targetPlId === 'favourites') {
      candidateIds = Object.values(tracks).filter((t) => t.isFavourite).map((t) => t.id);
    } else {
      const pl = playlists.find((p) => p.id === targetPlId);
      candidateIds = pl ? pl.trackIds : Object.keys(tracks);
    }

    if (!candidateIds.includes(trackId)) {
      candidateIds.push(trackId);
    }

    // Generate queue
    let newQueue: string[] = [];
    if (shuffle) {
      newQueue = shuffleArray(candidateIds, trackId);
    } else {
      newQueue = [...candidateIds];
    }

    const queueIdx = newQueue.indexOf(trackId);

    set({
      queue: newQueue,
      currentQueueIndex: queueIdx >= 0 ? queueIdx : 0
    });

    // Ensure URL exists
    let playUrl = track.url;
    if (!playUrl && track.file) {
      playUrl = URL.createObjectURL(track.file);
      track.url = playUrl;
    } else if (!playUrl && track.isDemo) {
      useAudioStore.getState().setPlaybackState('loading');
      const blob = await generateSynthwaveDemoTrack();
      playUrl = URL.createObjectURL(blob);
      track.url = playUrl;
    }

    if (!playUrl) {
      useAudioStore.getState().setError(`Cannot access audio URL for track "${track.title}"`);
      return;
    }

    useAudioStore.setState({
      currentTrack: {
        id: track.id,
        name: track.name,
        size: track.size,
        type: track.type,
        url: playUrl,
        duration: track.duration,
        isDemo: track.isDemo
      },
      playbackState: 'playing',
      currentTime: 0,
      errorMessage: null
    });
  },

  playNext: async (isAutoEnd = false) => {
    const { queue, currentQueueIndex, repeatMode } = get();
    if (queue.length === 0) return;

    // Handle repeat one
    if (isAutoEnd && repeatMode === 'one') {
      const currentTrackId = queue[currentQueueIndex];
      if (currentTrackId) {
        await get().playTrack(currentTrackId);
        return;
      }
    }

    const nextIndex = currentQueueIndex + 1;

    // Inside queue boundaries
    if (nextIndex < queue.length) {
      const nextTrackId = queue[nextIndex];
      set({ currentQueueIndex: nextIndex });
      await get().playTrack(nextTrackId);
      return;
    }

    // At end of queue
    if (repeatMode === 'all') {
      const firstTrackId = queue[0];
      set({ currentQueueIndex: 0 });
      await get().playTrack(firstTrackId);
    } else {
      // Repeat off -> stop playback cleanly
      useAudioStore.getState().pause();
      useAudioStore.getState().setCurrentTime(0);
    }
  },

  playPrevious: async () => {
    const { queue, currentQueueIndex, repeatMode } = get();
    if (queue.length === 0) return;

    // If more than 3 seconds in, restart current track
    const currentTime = useAudioStore.getState().currentTime;
    if (currentTime > 3) {
      useAudioStore.getState().seek(0);
      return;
    }

    const prevIndex = currentQueueIndex - 1;

    if (prevIndex >= 0) {
      const prevTrackId = queue[prevIndex];
      set({ currentQueueIndex: prevIndex });
      await get().playTrack(prevTrackId);
      return;
    }

    // At start of queue
    if (repeatMode === 'all') {
      const lastIndex = queue.length - 1;
      const lastTrackId = queue[lastIndex];
      set({ currentQueueIndex: lastIndex });
      await get().playTrack(lastTrackId);
    } else {
      useAudioStore.getState().seek(0);
    }
  },

  toggleShuffle: () => {
    const newShuffle = !get().shuffle;
    const { queue, currentQueueIndex } = get();

    if (newShuffle && queue.length > 1) {
      const currentId = queue[currentQueueIndex];
      const rest = queue.filter((_, idx) => idx !== currentQueueIndex);
      const shuffledRest = shuffleArray(rest);
      const newQueue = currentId ? [currentId, ...shuffledRest] : shuffledRest;
      set({ shuffle: true, queue: newQueue, currentQueueIndex: 0 });
    } else {
      set({ shuffle: newShuffle });
    }

    saveLibraryToStorage(get().tracks, get().playlists, {
      shuffle: newShuffle,
      repeatMode: get().repeatMode,
      activePlaylistId: get().activePlaylistId
    });
  },

  cycleRepeatMode: () => {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const currentIdx = modes.indexOf(get().repeatMode);
    const nextMode = modes[(currentIdx + 1) % modes.length];

    set({ repeatMode: nextMode });

    // Also sync loop flag to audioStore for repeat 'one'
    useAudioStore.setState({ isLooping: nextMode === 'one' });

    saveLibraryToStorage(get().tracks, get().playlists, {
      shuffle: get().shuffle,
      repeatMode: nextMode,
      activePlaylistId: get().activePlaylistId
    });
  },

  addToQueue: (trackId) => {
    set((state) => ({ queue: [...state.queue, trackId] }));
  },

  removeFromQueue: (index) => {
    const { queue, currentQueueIndex } = get();
    const updated = [...queue];
    updated.splice(index, 1);

    let nextIndex = currentQueueIndex;
    if (index < currentQueueIndex) {
      nextIndex = Math.max(0, currentQueueIndex - 1);
    } else if (index === currentQueueIndex && nextIndex >= updated.length) {
      nextIndex = Math.max(0, updated.length - 1);
    }

    set({ queue: updated, currentQueueIndex: nextIndex });
  },

  clearQueue: () => {
    set({ queue: [], currentQueueIndex: -1 });
  },

  reorderQueue: (fromIndex, toIndex) => {
    const { queue, currentQueueIndex } = get();
    const updated = [...queue];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);

    // Adjust currentQueueIndex
    let nextIndex = currentQueueIndex;
    if (fromIndex === currentQueueIndex) {
      nextIndex = toIndex;
    } else if (fromIndex < currentQueueIndex && toIndex >= currentQueueIndex) {
      nextIndex--;
    } else if (fromIndex > currentQueueIndex && toIndex <= currentQueueIndex) {
      nextIndex++;
    }

    set({ queue: updated, currentQueueIndex: nextIndex });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setSort: (field, order) => {
    const currentField = get().sortField;
    const currentOrder = get().sortOrder;

    if (order) {
      set({ sortField: field, sortOrder: order });
    } else if (currentField === field) {
      set({ sortOrder: currentOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      set({ sortField: field, sortOrder: 'asc' });
    }
  },

  toggleLibrary: (open) => {
    set((state) => ({ isLibraryOpen: open !== undefined ? open : !state.isLibraryOpen }));
  },

  toggleQueue: (open) => {
    set((state) => ({ isQueueOpen: open !== undefined ? open : !state.isQueueOpen }));
  },

  getFilteredTracks: () => {
    const { tracks, playlists, activePlaylistId, searchQuery, sortField, sortOrder } = get();

    let candidateIds: string[] = [];
    if (activePlaylistId === 'all') {
      candidateIds = Object.keys(tracks);
    } else if (activePlaylistId === 'favourites') {
      candidateIds = Object.values(tracks).filter((t) => t.isFavourite).map((t) => t.id);
    } else {
      const pl = playlists.find((p) => p.id === activePlaylistId);
      candidateIds = pl ? pl.trackIds : [];
    }

    let result = candidateIds.map((id) => tracks[id]).filter(Boolean);

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.album.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortField) {
        case 'title':
          valA = a.title.toLowerCase();
          valB = b.title.toLowerCase();
          break;
        case 'artist':
          valA = a.artist.toLowerCase();
          valB = b.artist.toLowerCase();
          break;
        case 'album':
          valA = a.album.toLowerCase();
          valB = b.album.toLowerCase();
          break;
        case 'duration':
          valA = a.duration || 0;
          valB = b.duration || 0;
          break;
        case 'addedAt':
        default:
          valA = a.addedAt || 0;
          valB = b.addedAt || 0;
          break;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  },

  getActivePlaylist: () => {
    const { playlists, activePlaylistId } = get();
    if (activePlaylistId === 'all') {
      return {
        id: 'all',
        name: '📀 All Library Tracks',
        description: 'Complete collection of all imported audio files',
        trackIds: Object.keys(get().tracks),
        isSystem: true,
        createdAt: 0,
        updatedAt: 0
      };
    }
    if (activePlaylistId === 'favourites') {
      return {
        id: 'favourites',
        name: '💖 Favourite Tracks',
        description: 'Your starred and favorite tracks',
        trackIds: Object.values(get().tracks).filter((t) => t.isFavourite).map((t) => t.id),
        isSystem: true,
        createdAt: 0,
        updatedAt: 0
      };
    }
    return playlists.find((p) => p.id === activePlaylistId) || null;
  },

  getTrackCount: (playlistId) => {
    const { tracks, playlists } = get();
    const id = playlistId || get().activePlaylistId;
    if (id === 'all') return Object.keys(tracks).length;
    if (id === 'favourites') return Object.values(tracks).filter((t) => t.isFavourite).length;
    const pl = playlists.find((p) => p.id === id);
    return pl ? pl.trackIds.length : 0;
  },

  getTotalDuration: (playlistId) => {
    const { tracks, playlists } = get();
    const id = playlistId || get().activePlaylistId;
    let trackIds: string[] = [];

    if (id === 'all') trackIds = Object.keys(tracks);
    else if (id === 'favourites') trackIds = Object.values(tracks).filter((t) => t.isFavourite).map((t) => t.id);
    else {
      const pl = playlists.find((p) => p.id === id);
      trackIds = pl ? pl.trackIds : [];
    }

    return trackIds.reduce((acc, tid) => acc + (tracks[tid]?.duration || 0), 0);
  }
}));
