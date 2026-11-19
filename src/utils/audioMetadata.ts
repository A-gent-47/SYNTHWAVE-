/**
 * Audio Metadata Extraction and Duplicate Detection Utilities
 */

export interface ParsedTrackInfo {
  title: string;
  artist: string;
  album: string;
}

/**
 * Parses track title, artist, and album gracefully from audio filename
 * e.g., "01 - Kavinsky - Nightcall.mp3" -> Artist: "Kavinsky", Title: "Nightcall"
 * e.g., "Perturbator - Future Club (2014).flac" -> Artist: "Perturbator", Title: "Future Club (2014)"
 * e.g., "Gunship.mp3" -> Artist: "Unknown Artist", Title: "Gunship"
 */
export function parseAudioMetadata(filename: string): ParsedTrackInfo {
  // Strip file extension
  let base = filename.replace(/\.(mp3|wav|ogg|flac|m4a|aac|webm)$/i, '').trim();

  // Strip leading track numbers like "01 - ", "01. ", "01 ", "01_"
  base = base.replace(/^(\d{1,3}[\s._-]+)/, '').trim();

  let artist = 'Unknown Artist';
  let title = base;
  let album = 'Local Collection';

  if (base.includes(' - ')) {
    const parts = base.split(' - ');
    if (parts.length >= 2) {
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }
  } else if (base.includes(' – ')) {
    // En-dash support
    const parts = base.split(' – ');
    if (parts.length >= 2) {
      artist = parts[0].trim();
      title = parts.slice(1).join(' – ').trim();
    }
  } else if (base.toLowerCase().includes(' by ')) {
    const parts = base.split(/\s+by\s+/i);
    if (parts.length >= 2) {
      title = parts[0].trim();
      artist = parts.slice(1).join(' by ').trim();
    }
  }

  // Fallback if title became empty
  if (!title) {
    title = filename;
  }

  return { title, artist, album };
}

/**
 * Deterministically generates a unique ID for a local file based on its name, size, and last modified date.
 * This guarantees duplicate detection when importing the same file repeatedly.
 */
export function generateFileTrackId(file: File): string {
  const rawKey = `${file.name}:${file.size}:${file.lastModified}`;
  // Simple deterministic 32-bit FNV-1a hash
  let hash = 2166136261;
  for (let i = 0; i < rawKey.length; i++) {
    hash ^= rawKey.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hexHash = (hash >>> 0).toString(16);
  return `trk-${hexHash}`;
}
