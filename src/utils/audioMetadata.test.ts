import { describe, it, expect } from 'vitest';
import { parseAudioMetadata, generateFileTrackId } from './audioMetadata';

describe('audioMetadata Utilities', () => {
  describe('parseAudioMetadata', () => {
    it('parses standard "Artist - Title.mp3" format', () => {
      const res = parseAudioMetadata('Kavinsky - Nightcall.mp3');
      expect(res.artist).toBe('Kavinsky');
      expect(res.title).toBe('Nightcall');
      expect(res.album).toBe('Local Collection');
    });

    it('strips leading track numbering like "01 - " or "02. "', () => {
      const res1 = parseAudioMetadata('01 - Perturbator - Future Club.flac');
      expect(res1.artist).toBe('Perturbator');
      expect(res1.title).toBe('Future Club');

      const res2 = parseAudioMetadata('03. Lazerhawk - Overdrive.wav');
      expect(res2.artist).toBe('Lazerhawk');
      expect(res2.title).toBe('Overdrive');
    });

    it('handles files with only a title, defaulting artist to Unknown Artist', () => {
      const res = parseAudioMetadata('Turbo_Killer.mp3');
      expect(res.artist).toBe('Unknown Artist');
      expect(res.title).toBe('Turbo_Killer');
    });

    it('handles "Title by Artist.mp3" format', () => {
      const res = parseAudioMetadata('Resonance by HOME.ogg');
      expect(res.artist).toBe('HOME');
      expect(res.title).toBe('Resonance');
    });

    it('handles titles with dashes gracefully', () => {
      const res = parseAudioMetadata('The Midnight - Days of Thunder - Remastered.mp3');
      expect(res.artist).toBe('The Midnight');
      expect(res.title).toBe('Days of Thunder - Remastered');
    });
  });

  describe('generateFileTrackId', () => {
    it('generates consistent deterministic IDs for the same file properties', () => {
      const file1 = new File(['audio data bytes'], 'synth.mp3', {
        type: 'audio/mpeg',
        lastModified: 1700000000000
      });
      const file2 = new File(['audio data bytes'], 'synth.mp3', {
        type: 'audio/mpeg',
        lastModified: 1700000000000
      });

      const id1 = generateFileTrackId(file1);
      const id2 = generateFileTrackId(file2);

      expect(id1).toBe(id2);
      expect(id1).toMatch(/^trk-[a-f0-9]+$/);
    });

    it('generates different IDs for files with different names or sizes', () => {
      const file1 = new File(['audio data bytes 1'], 'synth1.mp3', { type: 'audio/mpeg' });
      const file2 = new File(['audio data bytes 222'], 'synth2.mp3', { type: 'audio/mpeg' });

      expect(generateFileTrackId(file1)).not.toBe(generateFileTrackId(file2));
    });
  });
});
