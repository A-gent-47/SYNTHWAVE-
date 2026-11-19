export interface AudioMetrics {
  // Smoothed normalized frequency energies (0.0 to 1.0)
  bass: number;
  mid: number;
  treble: number;

  // Unsmoothed instantaneous frequency energies (0.0 to 1.0)
  rawBass: number;
  rawMid: number;
  rawTreble: number;

  // Overall energy across the full spectrum
  overall: number;

  // Real-time Beat transient detection & playback state
  isBeat?: boolean;
  beatIntensity?: number;
  beatPulse?: number;
  isPlaying?: boolean;

  // Raw byte buffers from Web Audio AnalyserNode
  frequencyData: Uint8Array; // 0 - 255 per bin
  waveform: Uint8Array;      // Time-domain samples centered around 128
}

export interface FrequencyBandConfig {
  bassRange: [number, number];   // Hz
  midRange: [number, number];    // Hz
  trebleRange: [number, number]; // Hz
}

