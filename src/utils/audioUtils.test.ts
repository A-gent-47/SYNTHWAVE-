import { describe, it, expect } from 'vitest';
import { formatTime, formatBytes, validateAudioFile } from './audioUtils';

describe('audioUtils', () => {
  describe('formatTime', () => {
    it('formats 0 seconds as 00:00', () => {
      expect(formatTime(0)).toBe('00:00');
    });

    it('formats 59 seconds as 00:59', () => {
      expect(formatTime(59)).toBe('00:59');
    });

    it('formats 65 seconds as 01:05', () => {
      expect(formatTime(65)).toBe('01:05');
    });

    it('formats 3600 seconds as 60:00', () => {
      expect(formatTime(3600)).toBe('60:00');
    });

    it('handles negative or NaN gracefully', () => {
      expect(formatTime(-10)).toBe('00:00');
      expect(formatTime(NaN)).toBe('00:00');
    });
  });

  describe('formatBytes', () => {
    it('formats 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('formats KB sizes', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(2048)).toBe('2 KB');
    });

    it('formats MB sizes', () => {
      expect(formatBytes(1024 * 1024 * 5.5)).toBe('5.5 MB');
    });
  });

  describe('validateAudioFile', () => {
    it('accepts valid audio files (mp3, wav, flac)', () => {
      const mp3File = new File(['mock content'], 'neon_drive.mp3', { type: 'audio/mpeg' });
      expect(validateAudioFile(mp3File).isValid).toBe(true);

      const wavFile = new File(['mock content'], 'synth_bass.wav', { type: 'audio/wav' });
      expect(validateAudioFile(wavFile).isValid).toBe(true);
    });

    it('rejects unsupported file formats', () => {
      const txtFile = new File(['some text'], 'lyrics.txt', { type: 'text/plain' });
      const result = validateAudioFile(txtFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unsupported format');
    });

    it('rejects oversized files exceeding 150MB', () => {
      const largeFile = new File([''], 'huge.wav', { type: 'audio/wav' });
      Object.defineProperty(largeFile, 'size', { value: 160 * 1024 * 1024 });
      const result = validateAudioFile(largeFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File is too large');
    });
  });
});
