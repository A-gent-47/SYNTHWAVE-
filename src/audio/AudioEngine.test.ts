import { describe, it, expect, beforeEach } from 'vitest';
import { AudioEngine } from './AudioEngine';

describe('AudioEngine', () => {
  let engine: AudioEngine;

  beforeEach(() => {
    engine = AudioEngine.getInstance();
    engine.resetMetrics();
  });

  it('provides a singleton instance', () => {
    const instanceA = AudioEngine.getInstance();
    const instanceB = AudioEngine.getInstance();
    expect(instanceA).toBe(instanceB);
  });

  it('initializes with default zero metrics', () => {
    const metrics = engine.getMetrics();
    expect(metrics.bass).toBe(0);
    expect(metrics.mid).toBe(0);
    expect(metrics.treble).toBe(0);
    expect(metrics.overall).toBe(0);
    expect(metrics.isBeat).toBe(false);
    expect(metrics.beatIntensity).toBe(0);
    expect(metrics.beatPulse).toBe(0);
    expect(metrics.isPlaying).toBe(false);
    expect(metrics.frequencyData).toBeDefined();
    expect(metrics.waveform).toBeDefined();
    expect(metrics.frequencyData.length).toBe(512);
  });

  it('resets metrics cleanly', () => {
    engine.resetMetrics();
    const metrics = engine.getMetrics();
    expect(metrics.bass).toBe(0);
    expect(metrics.mid).toBe(0);
    expect(metrics.treble).toBe(0);
    expect(metrics.isBeat).toBe(false);
    expect(metrics.beatPulse).toBe(0);
  });

  it('provides resume method without throwing', async () => {
    await expect(engine.resume()).resolves.toBeUndefined();
  });

  it('updates and clamps sensitivity multipliers correctly', () => {
    engine.setSensitivity(2.5, 0.8, 1.4);
    const sensitivity = engine.getSensitivity();
    expect(sensitivity.bass).toBe(2.5);
    expect(sensitivity.mid).toBe(0.8);
    expect(sensitivity.treble).toBe(1.4);

    // Test clamping limits (0.1 to 3.0)
    engine.setSensitivity(0.01, 10.0, -5.0);
    const clamped = engine.getSensitivity();
    expect(clamped.bass).toBe(0.1);
    expect(clamped.mid).toBe(3.0);
    expect(clamped.treble).toBe(0.1);

    // Reset back to normal
    engine.setSensitivity(1.0, 1.0, 1.0);
  });
});

