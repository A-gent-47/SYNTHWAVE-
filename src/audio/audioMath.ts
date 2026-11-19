/**
 * Pure mathematical functions for Audio Analysis and DSP frequency extraction.
 */

/**
 * Maps a frequency in Hertz to its corresponding FFT bin index.
 */
export function frequencyToBinIndex(
  freqHz: number,
  sampleRate: number,
  fftSize: number
): number {
  if (freqHz <= 0) return 0;
  const nyquist = sampleRate / 2;
  const clampedFreq = Math.min(freqHz, nyquist);
  const totalBins = fftSize / 2;
  return Math.min(
    Math.floor((clampedFreq / nyquist) * totalBins),
    totalBins - 1
  );
}

/**
 * Calculates the average normalized energy (0.0 to 1.0) of a frequency band.
 */
export function calculateBandEnergy(
  frequencyData: Uint8Array,
  startBin: number,
  endBin: number
): number {
  if (startBin > endBin || startBin >= frequencyData.length) return 0;

  const validStart = Math.max(0, startBin);
  const validEnd = Math.min(endBin, frequencyData.length - 1);
  const count = validEnd - validStart + 1;
  if (count <= 0) return 0;

  let sum = 0;
  for (let i = validStart; i <= validEnd; i++) {
    sum += frequencyData[i];
  }

  // Frequency data values are 0 - 255.
  // Normalize to 0.0 - 1.0 range:
  return sum / (count * 255);
}

/**
 * Asymmetric lerp smoothing for snappy attack and smooth cinematic release.
 */
export function smoothMetric(
  current: number,
  target: number,
  attack: number = 0.45,
  release: number = 0.15
): number {
  if (isNaN(current)) current = 0;
  if (isNaN(target)) target = 0;

  const alpha = target > current ? attack : release;
  const clampedAlpha = Math.max(0, Math.min(alpha, 1));
  return current + (target - current) * clampedAlpha;
}
