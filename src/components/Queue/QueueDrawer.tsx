import React from 'react';
import {
  ListMusic,
  X,
  Trash2,
  ChevronUp,
  ChevronDown,
  Volume2
} from 'lucide-react';
import { usePlaylistStore } from '../../store/playlistStore';
import { formatTime } from '../../utils/audioUtils';
import styles from './QueueDrawer.module.css';

export const QueueDrawer: React.FC = () => {
  const {
    queue,
    currentQueueIndex,
    tracks,
    isQueueOpen,
    toggleQueue,
    removeFromQueue,
    clearQueue,
    reorderQueue,
    playTrack
  } = usePlaylistStore();


  if (!isQueueOpen) return null;

  const currentTrackId = queue[currentQueueIndex];
  const currentTrack = currentTrackId ? tracks[currentTrackId] : null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={styles.queueOverlay}
        onClick={() => toggleQueue(false)}
        aria-hidden="true"
      />

      {/* Slide-out Queue Drawer */}
      <aside
        className={styles.queueDrawer}
        role="dialog"
        aria-label="Playback Queue"
        aria-modal="true"
      >
        <div className={styles.drawerHeader}>
          <div className={styles.drawerTitle}>
            <ListMusic size={16} />
            <span>Queue ({queue.length})</span>
          </div>

          <div className={styles.headerActions}>
            {queue.length > 0 && (
              <button
                type="button"
                onClick={clearQueue}
                className={styles.clearBtn}
                title="Clear all upcoming tracks from queue"
                aria-label="Clear queue"
                id="btn-clear-queue"
              >
                <Trash2 size={12} style={{ marginRight: '4px' }} />
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={() => toggleQueue(false)}
              className={styles.closeBtn}
              title="Close Queue (Esc / Q)"
              aria-label="Close queue"
              id="btn-close-queue"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {queue.length === 0 ? (
          <div className={styles.emptyQueue}>
            <ListMusic size={32} opacity={0.3} />
            <span className={styles.emptyText}>Queue is empty</span>
            <span className={styles.emptySubtext}>
              Add songs from your library or playlists to line up upcoming tracks.
            </span>
          </div>
        ) : (
          <div className={styles.queueList}>
            {/* Currently Playing Track */}
            {currentTrack && (
              <>
                <div className={styles.sectionHeader}>Now Playing</div>
                <div className={`${styles.queueItem} ${styles.queueItemActive}`}>
                  <div className={styles.itemLeft}>
                    <Volume2
                      size={15}
                      color="var(--text-primary)"
                    />
                    <div className={styles.itemDetails}>
                      <span className={styles.itemTitle} title={currentTrack.title}>
                        {currentTrack.title}
                      </span>
                      <span className={styles.itemArtist}>
                        {currentTrack.artist} • {formatTime(currentTrack.duration)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Upcoming Queue Tracks */}
            <div className={styles.sectionHeader}>
              Up Next ({Math.max(0, queue.length - (currentQueueIndex + 1))})
            </div>

            {queue.map((trackId, index) => {
              const track = tracks[trackId];
              if (!track) return null;
              const isCurrent = index === currentQueueIndex;

              return (
                <div
                  key={`${trackId}-${index}`}
                  className={`${styles.queueItem} ${isCurrent ? styles.queueItemActive : ''}`}
                  onClick={() => playTrack(trackId)}
                >
                  <div className={styles.itemLeft}>
                    <span className={styles.itemIndex}>{index + 1}</span>
                    <div className={styles.itemDetails}>
                      <span className={styles.itemTitle} title={track.title}>
                        {track.title}
                      </span>
                      <span className={styles.itemArtist}>
                        {track.artist} {track.duration > 0 ? `• ${formatTime(track.duration)}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className={styles.itemActions} onClick={(e) => e.stopPropagation()}>
                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => reorderQueue(index, index - 1)}
                      className={styles.iconBtn}
                      title="Move Up"
                      aria-label="Move track up in queue"
                    >
                      <ChevronUp size={14} />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={index === queue.length - 1}
                      onClick={() => reorderQueue(index, index + 1)}
                      className={styles.iconBtn}
                      title="Move Down"
                      aria-label="Move track down in queue"
                    >
                      <ChevronDown size={14} />
                    </button>

                    {/* Remove Track */}
                    <button
                      type="button"
                      onClick={() => removeFromQueue(index)}
                      className={`${styles.iconBtn} ${styles.removeBtn}`}
                      title="Remove from Queue"
                      aria-label="Remove from queue"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </aside>
    </>
  );
};
