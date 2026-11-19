import { describe, it, expect } from 'vitest';
import { frequencyToBinIndex, calculateBandEnergy, smoothMetric } from './audioMath';

describe('audioMath DSP utilities', () => {
  const sampleRate = 44100;
  const fftSize = 1024; // 512 total frequency bins (0 to 22050 Hz)

  describe('frequencyToBinIndex', () => {
    it('maps 0 Hz to bin 0', () => {
      expect(frequencyToBinIndex(0, sampleRate, fftSize)).toBe(0);
      expect(frequencyToBinIndex(-50, sampleRate, fftSize)).toBe(0);
    });

    it('maps 20 Hz (sub-bass) to bin 0', () => {
      // 20 / 22050 * 512 = 0.46 -> bin 0
      expect(frequencyToBinIndex(20, sampleRate, fftSize)).toBe(0);
    });

    it('maps 250 Hz (bass boundary) to bin 5', () => {
      // 250 / 22050 * 512 = 5.80 -> bin 5
      expect(frequencyToBinIndex(250, sampleRate, fftSize)).toBe(5);
    });

    it('maps 2500 Hz (mids boundary) to bin 58', () => {
      // 2500 / 22050 * 512 = 58.04 -> bin 58
      expect(frequencyToBinIndex(2500, sampleRate, fftSize)).toBe(58);
    });

    it('maps nyquist frequency (22050 Hz) to last bin (511)', () => {
      expect(frequencyToBinIndex(22050, sampleRate, fftSize)).toBe(511);
    });

    it('clamps frequencies above nyquist to last bin (511)', () => {
      expect(frequencyToBinIndex(48000, sampleRate, fftSize)).toBe(511);
    });
  });

  describe('calculateBandEnergy', () => {
    it('returns 0.0 when all frequencies in band are 0', () => {
      const data = new Uint8Array(512);
      expect(calculateBandEnergy(data, 0, 10)).toBe(0);
    });

    it('returns 1.0 when all frequencies in band are at max (255)', () => {
      const data = new Uint8Array(512).fill(255);
      expect(calculateBandEnergy(data, 10, 20)).toBe(1);
    });

    it('returns normalized average for mixed frequency values', () => {
      const data = new Uint8Array(512);
      data[0] = 0;
      data[1] = 255;
      // Average = 127.5 / 255 = 0.5
      expect(calculateBandEnergy(data, 0, 1)).toBe(0.5);
    });

    it('returns 0 for invalid bin ranges', () => {
      const data = new Uint8Array(512);
      expect(calculateBandEnergy(data, 100, 50)).toBe(0);
      expect(calculateBandEnergy(data, 600, 700)).toBe(0);
    });
  });

  describe('smoothMetric', () => {
    it('applies attack coefficient when target > current (rapid rise)', () => {
      const current = 0.2;
      const target = 1.0;
      const attack = 0.5;
      // 0.2 + (1.0 - 0.2) * 0.5 = 0.6
      expect(smoothMetric(current, target, attack, 0.1)).toBeCloseTo(0.6);
    });

    it('applies release coefficient when target < current (slow decay)', () => {
      const current = 0.8;
      const target = 0.0;
      const release = 0.2;
      // 0.8 + (0.0 - 0.8) * 0.2 = 0.64
      expect(smoothMetric(current, target, 0.5, release)).toBeCloseTo(0.64);
    });

    it('handles NaN gracefully', () => {
      expect(smoothMetric(NaN, 0.5)).toBeCloseTo(0.225);
      expect(smoothMetric(0.5, NaN)).toBeCloseTo(0.425);
    });
  });
});
