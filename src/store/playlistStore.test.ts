import { describe, it, expect, beforeEach } from 'vitest';
import { usePlaylistStore } from './playlistStore';
import { useAudioStore } from './audioStore';

describe('Playlist and Music Library Store', () => {
  beforeEach(() => {
    localStorage.clear();
    usePlaylistStore.setState({
      tracks: {},
      playlists: [
        {
          id: 'test-playlist-1',
          name: 'Cyber Drive',
          trackIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ],
      activePlaylistId: 'all',
      queue: [],
      currentQueueIndex: -1,
      shuffle: false,
      repeatMode: 'all',
      searchQuery: '',
      sortField: 'addedAt',
      sortOrder: 'desc',
      isLibraryOpen: false,
      isQueueOpen: false
    });
    useAudioStore.getState().clearTrack();
  });

  describe('Playlist Management', () => {
    it('creates a new playlist with unique ID and name', () => {
      const plId = usePlaylistStore.getState().createPlaylist('Synthwave Beats', 'Retro vibes');
      const playlists = usePlaylistStore.getState().playlists;
      const created = playlists.find((p) => p.id === plId);

      expect(created).toBeDefined();
      expect(created?.name).toBe('Synthwave Beats');
      expect(created?.description).toBe('Retro vibes');
      expect(created?.trackIds).toEqual([]);
      expect(usePlaylistStore.getState().activePlaylistId).toBe(plId);
    });

    it('renames an existing playlist', () => {
      const plId = 'test-playlist-1';
      usePlaylistStore.getState().renamePlaylist(plId, 'Neon Highways');
      const pl = usePlaylistStore.getState().playlists.find((p) => p.id === plId);

      expect(pl?.name).toBe('Neon Highways');
    });

    it('deletes a playlist without deleting original tracks from library', async () => {
      const file = new File(['audio content'], 'Gunship - Tech Noir.mp3', { type: 'audio/mpeg' });
      const [trackId] = await usePlaylistStore.getState().importFiles([file], 'test-playlist-1');

      expect(usePlaylistStore.getState().tracks[trackId]).toBeDefined();

      // Delete the playlist
      usePlaylistStore.getState().deletePlaylist('test-playlist-1');

      // Playlist is gone
      expect(usePlaylistStore.getState().playlists.find((p) => p.id === 'test-playlist-1')).toBeUndefined();
      // Track still exists in library!
      expect(usePlaylistStore.getState().tracks[trackId]).toBeDefined();
    });

    it('clears all tracks from a playlist', async () => {
      const file1 = new File(['content 1'], 'track1.mp3', { type: 'audio/mpeg' });
      const file2 = new File(['content 2'], 'track2.mp3', { type: 'audio/mpeg' });
      const [id1, id2] = await usePlaylistStore.getState().importFiles([file1, file2], 'test-playlist-1');

      expect(usePlaylistStore.getState().playlists[0].trackIds).toHaveLength(2);

      usePlaylistStore.getState().clearPlaylist('test-playlist-1');
      expect(usePlaylistStore.getState().playlists[0].trackIds).toHaveLength(0);

      // Tracks still exist in main library
      expect(usePlaylistStore.getState().tracks[id1]).toBeDefined();
      expect(usePlaylistStore.getState().tracks[id2]).toBeDefined();
    });

    it('adds tracks to playlist and prevents duplicate IDs within the same playlist', () => {
      usePlaylistStore.getState().addTracksToPlaylist('test-playlist-1', ['trk-1', 'trk-2']);
      expect(usePlaylistStore.getState().playlists[0].trackIds).toEqual(['trk-1', 'trk-2']);

      // Attempt to add duplicate trk-1
      usePlaylistStore.getState().addTracksToPlaylist('test-playlist-1', ['trk-1', 'trk-3']);
      expect(usePlaylistStore.getState().playlists[0].trackIds).toEqual(['trk-1', 'trk-2', 'trk-3']);
    });

    it('removes an individual track from a playlist by index', () => {
      usePlaylistStore.getState().addTracksToPlaylist('test-playlist-1', ['trk-A', 'trk-B', 'trk-C']);
      usePlaylistStore.getState().removeTrackFromPlaylist('test-playlist-1', 1); // remove trk-B

      expect(usePlaylistStore.getState().playlists[0].trackIds).toEqual(['trk-A', 'trk-C']);
    });

    it('reorders tracks in a playlist', () => {
      usePlaylistStore.getState().addTracksToPlaylist('test-playlist-1', ['trk-1', 'trk-2', 'trk-3']);
      usePlaylistStore.getState().reorderPlaylist('test-playlist-1', 2, 0); // move trk-3 to beginning

      expect(usePlaylistStore.getState().playlists[0].trackIds).toEqual(['trk-3', 'trk-1', 'trk-2']);
    });
  });

  describe('Playback, Queue, and Navigation', () => {
    it('plays a track and creates a playback queue', async () => {
      const file1 = new File(['c1'], 'Kavinsky - Nightcall.mp3', { type: 'audio/mpeg' });
      const file2 = new File(['c2'], 'HOME - Resonance.mp3', { type: 'audio/mpeg' });
      const [id1, id2] = await usePlaylistStore.getState().importFiles([file1, file2]);

      await usePlaylistStore.getState().playTrack(id1);

      expect(usePlaylistStore.getState().queue).toContain(id1);
      expect(usePlaylistStore.getState().queue).toContain(id2);
      expect(usePlaylistStore.getState().currentQueueIndex).toBe(0);

      // Verifies audioStore updated with active track and playing state
      const current = useAudioStore.getState().currentTrack;
      expect(current?.id).toBe(id1);
      expect(useAudioStore.getState().playbackState).toBe('playing');
    });

    it('advances to next track with playNext()', async () => {
      const file1 = new File(['c1'], 'Track1.mp3', { type: 'audio/mpeg' });
      const file2 = new File(['c2'], 'Track2.mp3', { type: 'audio/mpeg' });
      const [id1, id2] = await usePlaylistStore.getState().importFiles([file1, file2]);

      await usePlaylistStore.getState().playTrack(id1);
      expect(useAudioStore.getState().currentTrack?.id).toBe(id1);

      await usePlaylistStore.getState().playNext();
      expect(useAudioStore.getState().currentTrack?.id).toBe(id2);
      expect(usePlaylistStore.getState().currentQueueIndex).toBe(1);
    });

    it('loops back to first track when queue ends and repeatMode is "all"', async () => {
      const file1 = new File(['c1'], 'Track1.mp3', { type: 'audio/mpeg' });
      const file2 = new File(['c2'], 'Track2.mp3', { type: 'audio/mpeg' });
      const [id1, id2] = await usePlaylistStore.getState().importFiles([file1, file2]);

      usePlaylistStore.setState({ repeatMode: 'all' });
      await usePlaylistStore.getState().playTrack(id2);

      await usePlaylistStore.getState().playNext();
      expect(useAudioStore.getState().currentTrack?.id).toBe(id1);
      expect(usePlaylistStore.getState().currentQueueIndex).toBe(0);
    });

    it('stops playback when queue ends and repeatMode is "off"', async () => {
      const file1 = new File(['c1'], 'Track1.mp3', { type: 'audio/mpeg' });
      const file2 = new File(['c2'], 'Track2.mp3', { type: 'audio/mpeg' });
      const [, id2] = await usePlaylistStore.getState().importFiles([file1, file2]);

      usePlaylistStore.setState({ repeatMode: 'off' });
      await usePlaylistStore.getState().playTrack(id2);

      await usePlaylistStore.getState().playNext();
      expect(useAudioStore.getState().playbackState).toBe('paused');
    });

    it('replays same track on end-of-track when repeatMode is "one"', async () => {
      const file = new File(['c1'], 'Track1.mp3', { type: 'audio/mpeg' });
      const [id1] = await usePlaylistStore.getState().importFiles([file]);

      usePlaylistStore.setState({ repeatMode: 'one' });
      await usePlaylistStore.getState().playTrack(id1);

      await usePlaylistStore.getState().playNext(true); // isAutoEnd = true
      expect(useAudioStore.getState().currentTrack?.id).toBe(id1);
    });

    it('plays previous track with playPrevious()', async () => {
      const file1 = new File(['c1'], 'Track1.mp3', { type: 'audio/mpeg' });
      const file2 = new File(['c2'], 'Track2.mp3', { type: 'audio/mpeg' });
      const [id1, id2] = await usePlaylistStore.getState().importFiles([file1, file2]);

      await usePlaylistStore.getState().playTrack(id2);
      useAudioStore.getState().setCurrentTime(1.0); // < 3 seconds

      await usePlaylistStore.getState().playPrevious();
      expect(useAudioStore.getState().currentTrack?.id).toBe(id1);
    });

    it('restarts current track if playback time is > 3 seconds on playPrevious()', async () => {
      const file1 = new File(['c1'], 'Track1.mp3', { type: 'audio/mpeg' });
      const [id1] = await usePlaylistStore.getState().importFiles([file1]);

      await usePlaylistStore.getState().playTrack(id1);
      useAudioStore.getState().setDuration(120);
      useAudioStore.getState().setCurrentTime(15);

      await usePlaylistStore.getState().playPrevious();
      expect(useAudioStore.getState().currentTime).toBe(0);
      expect(useAudioStore.getState().currentTrack?.id).toBe(id1);
    });

    it('shuffles queue without repeating the current track first', async () => {
      const file1 = new File(['c1'], 'SongA.mp3', { type: 'audio/mpeg' });
      const file2 = new File(['c2'], 'SongB.mp3', { type: 'audio/mpeg' });
      const file3 = new File(['c3'], 'SongC.mp3', { type: 'audio/mpeg' });
      const [id1] = await usePlaylistStore.getState().importFiles([file1, file2, file3]);

      await usePlaylistStore.getState().playTrack(id1);
      usePlaylistStore.getState().toggleShuffle();

      const queue = usePlaylistStore.getState().queue;
      expect(queue).toHaveLength(3);
      // The currently playing song remains at index 0 in the new queue
      expect(queue[0]).toBe(id1);
    });
  });

  describe('Queue Management', () => {
    it('adds, removes, reorders, and clears queue entries', () => {
      usePlaylistStore.getState().addToQueue('trk-1');
      usePlaylistStore.getState().addToQueue('trk-2');
      usePlaylistStore.getState().addToQueue('trk-3');

      expect(usePlaylistStore.getState().queue).toEqual(['trk-1', 'trk-2', 'trk-3']);

      // Remove index 1 (trk-2)
      usePlaylistStore.getState().removeFromQueue(1);
      expect(usePlaylistStore.getState().queue).toEqual(['trk-1', 'trk-3']);

      // Reorder index 1 to 0
      usePlaylistStore.getState().reorderQueue(1, 0);
      expect(usePlaylistStore.getState().queue).toEqual(['trk-3', 'trk-1']);

      // Clear queue
      usePlaylistStore.getState().clearQueue();
      expect(usePlaylistStore.getState().queue).toEqual([]);
      expect(usePlaylistStore.getState().currentQueueIndex).toBe(-1);
    });
  });

  describe('Search, Filtering, and Favourites', () => {
    it('filters tracks by title, artist, or album matching search query', async () => {
      const file1 = new File(['c1'], 'Perturbator - Future Club.mp3', { type: 'audio/mpeg' });
      const file2 = new File(['c2'], 'Carpenter Brut - Turbo Killer.mp3', { type: 'audio/mpeg' });
      await usePlaylistStore.getState().importFiles([file1, file2]);

      usePlaylistStore.getState().setSearchQuery('Future');
      let filtered = usePlaylistStore.getState().getFilteredTracks();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('Future Club');

      usePlaylistStore.getState().setSearchQuery('Carpenter');
      filtered = usePlaylistStore.getState().getFilteredTracks();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].artist).toBe('Carpenter Brut');
    });

    it('toggles favourite status and provides favourites view', async () => {
      const file1 = new File(['c1'], 'Miami Nights 1984 - Ocean Drive.mp3', { type: 'audio/mpeg' });
      const [id1] = await usePlaylistStore.getState().importFiles([file1]);

      expect(usePlaylistStore.getState().tracks[id1].isFavourite).toBe(false);

      usePlaylistStore.getState().toggleFavourite(id1);
      expect(usePlaylistStore.getState().tracks[id1].isFavourite).toBe(true);

      usePlaylistStore.getState().setActivePlaylistId('favourites');
      const favTracks = usePlaylistStore.getState().getFilteredTracks();
      expect(favTracks).toHaveLength(1);
      expect(favTracks[0].id).toBe(id1);
    });
  });

  describe('Persistence and Unavailable Files', () => {
    it('relinks an unavailable file when user re-selects it', async () => {
      // Simulate restored track from localStorage where file handle was revoked
      const mockTrackId = 'trk-offline-1';
      usePlaylistStore.setState({
        tracks: {
          [mockTrackId]: {
            id: mockTrackId,
            name: 'Offline Song.mp3',
            title: 'Offline Song',
            artist: 'Unknown Artist',
            album: 'Local Collection',
            duration: 180,
            size: 4000000,
            type: 'audio/mpeg',
            url: '',
            isUnavailable: true,
            addedAt: Date.now()
          }
        }
      });

      expect(usePlaylistStore.getState().tracks[mockTrackId].isUnavailable).toBe(true);

      // User reselects the file
      const reselectedFile = new File(['restored content'], 'Offline Song.mp3', { type: 'audio/mpeg' });
      const success = await usePlaylistStore.getState().relinkTrackFile(mockTrackId, reselectedFile);

      expect(success).toBe(true);
      expect(usePlaylistStore.getState().tracks[mockTrackId].isUnavailable).toBe(false);
      expect(usePlaylistStore.getState().tracks[mockTrackId].url).toContain('blob:');
    });
  });
});
