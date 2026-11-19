import { AudioTrackMetadata } from './audio';

export type RepeatMode = 'off' | 'all' | 'one';

export type SortField = 'title' | 'artist' | 'album' | 'duration' | 'addedAt';
export type SortOrder = 'asc' | 'desc';

export interface LibraryTrack extends AudioTrackMetadata {
  title: string;
  artist: string;
  album: string;
  file?: File;
  isFavourite?: boolean;
  isUnavailable?: boolean;
  addedAt: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  trackIds: string[];
  isSystem?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SerializedLibraryTrack {
  id: string;
  name: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  size: number;
  type: string;
  isDemo?: boolean;
  isFavourite?: boolean;
  addedAt: number;
}

export interface SerializedPlaylist {
  id: string;
  name: string;
  description?: string;
  trackIds: string[];
  isSystem?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SerializedLibraryState {
  version: number;
  tracks: SerializedLibraryTrack[];
  playlists: SerializedPlaylist[];
  settings: {
    shuffle: boolean;
    repeatMode: RepeatMode;
    activePlaylistId: string;
    volume?: number;
  };
}
