import React, { useState, useRef } from 'react';
import {
  Library as LibraryIcon,
  Heart,
  Plus,
  Play,
  Shuffle,
  Search,
  ArrowUpDown,
  Trash2,
  Edit2,
  Music,
  ListPlus,
  UploadCloud,
  ChevronUp,
  ChevronDown,
  X,
  AlertTriangle,
  Volume2
} from 'lucide-react';
import { usePlaylistStore } from '../../store/playlistStore';
import { useAudioStore } from '../../store/audioStore';
import { SortField } from '../../types/playlist';
import { formatTime, formatBytes } from '../../utils/audioUtils';
import styles from './LibraryView.module.css';

export const LibraryView: React.FC = () => {
  const {
    playlists,
    activePlaylistId,
    setActivePlaylistId,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    clearPlaylist,
    addTracksToPlaylist,
    removeTrackFromPlaylist,
    reorderPlaylist,
    deleteTrackFromLibrary,
    toggleFavourite,
    importFiles,
    addDemoTrack,
    relinkTrackFile,
    playTrack,
    addToQueue,
    searchQuery,
    setSearchQuery,
    sortField,
    sortOrder,
    setSort,
    getFilteredTracks,
    getActivePlaylist,
    getTrackCount,
    getTotalDuration,
    isLibraryOpen,
    toggleLibrary
  } = usePlaylistStore();

  const { currentTrack } = useAudioStore();

  // Dialog & Modal states
  const [modalType, setModalType] = useState<'create' | 'rename' | 'delete' | 'clear' | null>(null);
  const [targetPlaylistId, setTargetPlaylistId] = useState<string>('');
  const [modalInputName, setModalInputName] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // File pickers
  const fileInputRef = useRef<HTMLInputElement>(null);
  const relinkInputRef = useRef<HTMLInputElement>(null);
  const [relinkTargetId, setRelinkTargetId] = useState<string>('');

  if (!isLibraryOpen) return null;

  const filteredTracks = getFilteredTracks();
  const currentPlaylist = getActivePlaylist();
  const isCustomPlaylist = activePlaylistId !== 'all' && activePlaylistId !== 'favourites';

  // Handler for multi-file picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      importFiles(e.target.files, isCustomPlaylist ? activePlaylistId : undefined);
      e.target.value = '';
    }
  };

  // Handler for relinking offline files
  const handleRelinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && relinkTargetId) {
      relinkTrackFile(relinkTargetId, e.target.files[0]);
      e.target.value = '';
      setRelinkTargetId('');
    }
  };

  // Trigger relink picker
  const triggerRelink = (trackId: string) => {
    setRelinkTargetId(trackId);
    relinkInputRef.current?.click();
  };

  // Play All
  const handlePlayAll = () => {
    if (filteredTracks.length > 0) {
      playTrack(filteredTracks[0].id, activePlaylistId);
    }
  };

  // Shuffle Play
  const handleShufflePlay = () => {
    if (filteredTracks.length === 0) return;
    const randomTrack = filteredTracks[Math.floor(Math.random() * filteredTracks.length)];
    if (!usePlaylistStore.getState().shuffle) {
      usePlaylistStore.getState().toggleShuffle();
    }
    playTrack(randomTrack.id, activePlaylistId);
  };

  // Drag and drop reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex || !isCustomPlaylist) return;
    reorderPlaylist(activePlaylistId, draggedIndex, dropIndex);
    setDraggedIndex(null);
  };

  // Confirmation / Action execution
  const handleModalConfirm = () => {
    if (modalType === 'create') {
      createPlaylist(modalInputName);
    } else if (modalType === 'rename') {
      renamePlaylist(targetPlaylistId, modalInputName);
    } else if (modalType === 'delete') {
      deletePlaylist(targetPlaylistId);
    } else if (modalType === 'clear') {
      clearPlaylist(targetPlaylistId);
    }
    setModalType(null);
    setModalInputName('');
    setTargetPlaylistId('');
  };

  return (
    <div className={styles.libraryOverlay} role="region" aria-label="Music Library & Playlists">
      {/* Hidden File Pickers */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <input
        ref={relinkInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a"
        style={{ display: 'none' }}
        onChange={handleRelinkChange}
      />

      {/* Sidebar: Navigation & Playlists */}
      <aside className={styles.sidebar}>
        {/* Core Library Views */}
        <div className={styles.navSection}>
          <div className={styles.sectionTitleRow}>
            <span className={styles.sectionTitle}>LIBRARY</span>
          </div>

          <button
            type="button"
            className={`${styles.navItem} ${activePlaylistId === 'all' ? styles.navItemActive : ''}`}
            onClick={() => setActivePlaylistId('all')}
            id="nav-all-tracks"
          >
            <div className={styles.navItemLeft}>
              <LibraryIcon size={16} />
              <span className={styles.navItemName}>All Tracks</span>
            </div>
            <span className={styles.navItemCount}>{getTrackCount('all')}</span>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activePlaylistId === 'favourites' ? styles.navItemActive : ''}`}
            onClick={() => setActivePlaylistId('favourites')}
            id="nav-favourites"
          >
            <div className={styles.navItemLeft}>
              <Heart size={16} color="var(--neon-magenta)" />
              <span className={styles.navItemName}>Favourites</span>
            </div>
            <span className={styles.navItemCount}>{getTrackCount('favourites')}</span>
          </button>
        </div>

        {/* User Playlists */}
        <div className={styles.navSection}>
          <div className={styles.sectionTitleRow}>
            <span className={styles.sectionTitle}>PLAYLISTS ({playlists.length})</span>
            <button
              type="button"
              onClick={() => {
                setModalType('create');
                setModalInputName('');
              }}
              className={styles.addPlaylistBtn}
              title="Create New Playlist"
              aria-label="Create new playlist"
              id="btn-create-playlist"
            >
              <Plus size={16} />
            </button>
          </div>

          {playlists.map((pl) => (
            <div
              key={pl.id}
              className={`${styles.navItem} ${activePlaylistId === pl.id ? styles.navItemActive : ''}`}
              onClick={() => setActivePlaylistId(pl.id)}
            >
              <div className={styles.navItemLeft}>
                <Music size={15} />
                <span className={styles.navItemName} title={pl.name}>
                  {pl.name}
                </span>
              </div>

              <div className={styles.playlistItemActions} onClick={(e) => e.stopPropagation()}>
                <span className={styles.navItemCount}>{pl.trackIds.length}</span>

                <button
                  type="button"
                  onClick={() => {
                    setTargetPlaylistId(pl.id);
                    setModalInputName(pl.name);
                    setModalType('rename');
                  }}
                  className={styles.actionIconBtn}
                  title="Rename Playlist"
                  aria-label="Rename playlist"
                >
                  <Edit2 size={12} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetPlaylistId(pl.id);
                    setModalType('delete');
                  }}
                  className={`${styles.actionIconBtn} ${styles.deleteIconBtn}`}
                  title="Delete Playlist"
                  aria-label="Delete playlist"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Track List & Playlist Details */}
      <section className={styles.mainContent}>
        {/* Playlist Header Banner */}
        <div className={styles.libraryHeader}>
          <div className={styles.headerTopRow}>
            <div className={styles.playlistHeading}>
              <h2 className={styles.playlistTitle}>{currentPlaylist?.name || 'Tracks'}</h2>
              <div className={styles.playlistMeta}>
                <span>{filteredTracks.length} tracks</span>
                <span>•</span>
                <span>Total: {formatTime(getTotalDuration())}</span>
                {currentPlaylist?.description && (
                  <>
                    <span>•</span>
                    <span>{currentPlaylist.description}</span>
                  </>
                )}
              </div>
            </div>

            {/* Close Library button */}
            <button
              type="button"
              onClick={() => toggleLibrary(false)}
              className={styles.secondaryActionBtn}
              title="Close Library (L)"
              aria-label="Close library"
              id="btn-close-library"
            >
              <X size={15} />
              <span>Back to Visualizer</span>
            </button>
          </div>

          {/* Action buttons & Toolbars */}
          <div className={styles.primaryActionsRow}>
            <button
              type="button"
              onClick={handlePlayAll}
              disabled={filteredTracks.length === 0}
              className={styles.playAllBtn}
              id="btn-play-all"
            >
              <Play size={15} />
              <span>Play All</span>
            </button>

            <button
              type="button"
              onClick={handleShufflePlay}
              disabled={filteredTracks.length === 0}
              className={styles.secondaryActionBtn}
              id="btn-shuffle-play"
            >
              <Shuffle size={14} />
              <span>Shuffle Play</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={styles.secondaryActionBtn}
              id="btn-add-files"
            >
              <UploadCloud size={14} />
              <span>Import Files</span>
            </button>

            <button
              type="button"
              onClick={() => addDemoTrack()}
              className={styles.secondaryActionBtn}
              title="Generate 80s Synth Demo Track"
              id="btn-add-demo"
            >
              <Plus size={14} />
              <span>Add Demo Track</span>
            </button>

            {isCustomPlaylist && (
              <button
                type="button"
                onClick={() => {
                  setTargetPlaylistId(activePlaylistId);
                  setModalType('clear');
                }}
                disabled={filteredTracks.length === 0}
                className={`${styles.secondaryActionBtn} ${styles.clearDangerBtn}`}
                id="btn-clear-playlist"
              >
                <Trash2 size={14} />
                <span>Clear Playlist</span>
              </button>
            )}
          </div>

          {/* Search & Sort Row */}
          <div className={styles.toolbarRow}>
            <div className={styles.searchBox}>
              <Search size={15} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search title, artist, album..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
                id="input-library-search"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className={styles.sortControls}>
              <span className={styles.sortLabel}>SORT:</span>
              <select
                value={sortField}
                onChange={(e) => setSort(e.target.value as SortField)}
                className={styles.sortSelect}
                aria-label="Sort tracks by"
                id="select-library-sort"
              >
                <option value="addedAt">Date Added</option>
                <option value="title">Title</option>
                <option value="artist">Artist</option>
                <option value="album">Album</option>
                <option value="duration">Duration</option>
              </select>

              <button
                type="button"
                onClick={() => setSort(sortField, sortOrder === 'asc' ? 'desc' : 'asc')}
                className={styles.sortOrderBtn}
                title={`Order: ${sortOrder.toUpperCase()}`}
                aria-label="Toggle sort order"
                id="btn-toggle-sort-order"
              >
                <ArrowUpDown size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Track Table */}
        <div className={styles.tableContainer}>
          {filteredTracks.length === 0 ? (
            <div className={styles.emptyState}>
              <Music size={44} opacity={0.3} />
              <span className={styles.emptyStateTitle}>
                {searchQuery
                  ? 'NO MATCHING TRACKS FOUND'
                  : activePlaylistId === 'favourites'
                  ? 'NO FAVOURITES SAVED YET'
                  : 'THIS PLAYLIST HAS NO TRACKS'}
              </span>
              <p className={styles.emptyStateText}>
                {searchQuery
                  ? 'Try clearing the search query or searching for a different keyword.'
                  : activePlaylistId === 'favourites'
                  ? 'Click the heart icon on any track to bookmark your favorite songs.'
                  : 'Click "Import Files" or "Add 80s Demo" to load songs into your collection.'}
              </p>
            </div>
          ) : (
            <table className={styles.trackTable} aria-label="Playlist tracks">
              <thead className={styles.tableHeader}>
                <tr>
                  <th className={`${styles.th} ${styles.tdIndex}`}>#</th>
                  <th className={styles.th}>Title & Artist</th>
                  <th className={styles.th}>Album</th>
                  <th className={styles.th}>Duration</th>
                  <th className={`${styles.th} ${styles.tdFav}`}>Fav</th>
                  <th className={`${styles.th} ${styles.tdActions}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTracks.map((track, index) => {
                  const isCurrent = currentTrack?.id === track.id;

                  return (
                    <tr
                      key={track.id}
                      draggable={isCustomPlaylist}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index)}
                      onClick={() => playTrack(track.id, activePlaylistId)}
                      className={`${styles.trackRow} ${isCurrent ? styles.trackRowPlaying : ''}`}
                    >
                      {/* Index / Playing icon */}
                      <td className={`${styles.td} ${styles.tdIndex}`}>
                        {isCurrent ? (
                          <Volume2 size={15} color="var(--text-primary)" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </td>

                      {/* Title & Artist */}
                      <td className={styles.td}>
                        <div className={styles.tdTitleGroup}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span className={styles.tdTitle} title={track.title}>
                              {track.title}
                            </span>
                            {track.isUnavailable && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerRelink(track.id);
                                }}
                                className={styles.unavailableBadge}
                                title="Click to reselect local file"
                              >
                                <AlertTriangle size={11} />
                                <span>Reselect File</span>
                              </button>
                            )}
                          </div>
                          <span className={styles.tdArtist}>{track.artist}</span>
                        </div>
                      </td>

                      {/* Album */}
                      <td className={`${styles.td} ${styles.tdAlbum}`}>
                        <span title={track.album}>{track.album}</span>
                      </td>

                      {/* Duration */}
                      <td className={`${styles.td} ${styles.tdDuration}`}>
                        <span>{track.duration > 0 ? formatTime(track.duration) : formatBytes(track.size)}</span>
                      </td>

                      {/* Favourite Toggle */}
                      <td className={`${styles.td} ${styles.tdFav}`} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => toggleFavourite(track.id)}
                          className={`${styles.favBtn} ${track.isFavourite ? styles.favBtnActive : ''}`}
                          title={track.isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
                          aria-label="Toggle favourite"
                        >
                          <Heart
                            size={16}
                            fill={track.isFavourite ? 'var(--neon-magenta)' : 'none'}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className={`${styles.td} ${styles.tdActions}`} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.rowActions}>
                          {/* Add to Queue */}
                          <button
                            type="button"
                            onClick={() => addToQueue(track.id)}
                            className={styles.actionIconBtn}
                            title="Add to Upcoming Queue"
                            aria-label="Add to queue"
                          >
                            <ListPlus size={16} />
                          </button>

                          {/* Add to another playlist */}
                          {playlists.length > 0 && (
                            <select
                              defaultValue=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  addTracksToPlaylist(e.target.value, [track.id]);
                                  e.target.value = '';
                                }
                              }}
                              className={styles.sortSelect}
                              style={{ width: '80px', padding: '0.15rem 0.3rem', fontSize: '0.65rem' }}
                              title="Add to Playlist"
                              aria-label="Add track to playlist"
                            >
                              <option value="" disabled>+ Playlist</option>
                              {playlists.map((pl) => (
                                <option key={pl.id} value={pl.id}>
                                  {pl.name}
                                </option>
                              ))}
                            </select>
                          )}

                          {/* Reordering Up/Down (in custom playlist) */}
                          {isCustomPlaylist && (
                            <>
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => reorderPlaylist(activePlaylistId, index, index - 1)}
                                className={styles.actionIconBtn}
                                title="Move Track Up"
                                aria-label="Move track up"
                              >
                                <ChevronUp size={14} />
                              </button>
                              <button
                                type="button"
                                disabled={index === filteredTracks.length - 1}
                                onClick={() => reorderPlaylist(activePlaylistId, index, index + 1)}
                                className={styles.actionIconBtn}
                                title="Move Track Down"
                                aria-label="Move track down"
                              >
                                <ChevronDown size={14} />
                              </button>
                            </>
                          )}

                          {/* Remove from this playlist */}
                          {isCustomPlaylist ? (
                            <button
                              type="button"
                              onClick={() => removeTrackFromPlaylist(activePlaylistId, index)}
                              className={`${styles.actionIconBtn} ${styles.deleteIconBtn}`}
                              title="Remove from Playlist"
                              aria-label="Remove from playlist"
                            >
                              <X size={16} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => deleteTrackFromLibrary(track.id)}
                              className={`${styles.actionIconBtn} ${styles.deleteIconBtn}`}
                              title="Delete from Library"
                              aria-label="Delete from library"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Confirmation & Creation Modals */}
      {modalType && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>
              {modalType === 'create' && 'CREATE NEW PLAYLIST'}
              {modalType === 'rename' && 'RENAME PLAYLIST'}
              {modalType === 'delete' && 'DELETE PLAYLIST?'}
              {modalType === 'clear' && 'CLEAR ALL TRACKS?'}
            </h3>

            {(modalType === 'create' || modalType === 'rename') && (
              <input
                type="text"
                value={modalInputName}
                placeholder="Playlist name..."
                onChange={(e) => setModalInputName(e.target.value)}
                className={styles.modalInput}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleModalConfirm();
                }}
              />
            )}

            {modalType === 'delete' && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to delete this playlist? Your original audio files in the music library will NOT be deleted.
              </p>
            )}

            {modalType === 'clear' && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to remove all tracks from this playlist? The tracks will still remain in your main library.
              </p>
            )}

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className={styles.modalCancelBtn}
              >
                CANCEL
              </button>

              <button
                type="button"
                onClick={handleModalConfirm}
                className={modalType === 'delete' || modalType === 'clear' ? styles.modalDangerBtn : styles.modalConfirmBtn}
                id="btn-modal-confirm"
              >
                {modalType === 'delete' ? 'DELETE' : modalType === 'clear' ? 'CLEAR' : 'CONFIRM'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
