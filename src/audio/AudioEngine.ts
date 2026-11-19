import { AudioMetrics } from './types';
import { frequencyToBinIndex, calculateBandEnergy, smoothMetric } from './audioMath';

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceMap = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();
  private activeElement: HTMLMediaElement | null = null;

  // FFT Configuration: low smoothingTimeConstant eliminates lag between audio output and visualizer
  private readonly fftSize = 1024;
  private readonly smoothingTimeConstant = 0.35;

  // Buffers (512 bins each, pre-allocated to avoid GC in animation loop)
  private frequencyData: Uint8Array = new Uint8Array(512);
  private waveformData: Uint8Array = new Uint8Array(512);

  // Cached Frequency Bin Boundaries (calculated once per sampleRate)
  private bassBins: [number, number] = [0, 6];
  private midBins: [number, number] = [6, 58];
  private trebleBins: [number, number] = [58, 372];

  // Smoothed Metric Values
  private smoothedBass = 0;
  private smoothedMid = 0;
  private smoothedTreble = 0;

  // Real-time Beat Detection Tracker
  private rollingBassAverage = 0;
  private lastBeatTime = 0;
  private beatPulse = 0;

  // DSP Sensitivity Multipliers (0.1 to 3.0, default 1.0)
  private bassMultiplier = 1.0;
  private midMultiplier = 1.0;
  private trebleMultiplier = 1.0;

  // Cached Metrics Object
  private metrics: AudioMetrics = {
    bass: 0,
    mid: 0,
    treble: 0,
    rawBass: 0,
    rawMid: 0,
    rawTreble: 0,
    overall: 0,
    isBeat: false,
    beatIntensity: 0,
    beatPulse: 0,
    isPlaying: false,
    frequencyData: this.frequencyData,
    waveform: this.waveformData,
  };


  private constructor() {
    // Lazy initialization handled on first user interaction or element connection
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Initializes or resumes the Web Audio AudioContext on user interaction.
   */
  public async init(): Promise<void> {
    if (typeof window === 'undefined') return;

    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioCtxClass) {
        console.warn('Web Audio API not supported in this browser.');
        return;
      }

      this.audioCtx = new AudioCtxClass();

      // Configure AnalyserNode
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = this.fftSize;
      this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;

      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      this.waveformData = new Uint8Array(this.analyser.frequencyBinCount);

      this.calculateBinRanges();
    }

    if (this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch (err) {
        console.warn('Could not resume AudioContext yet (requires user gesture):', err);
      }
    }
  }

  /**
   * Calculates FFT bin indices for the 3 primary frequency bands based on context sample rate.
   */
  private calculateBinRanges(): void {
    if (!this.audioCtx) return;
    const sampleRate = this.audioCtx.sampleRate || 44100;

    const startBass = frequencyToBinIndex(20, sampleRate, this.fftSize);
    const endBass = frequencyToBinIndex(250, sampleRate, this.fftSize);

    const startMid = frequencyToBinIndex(250, sampleRate, this.fftSize);
    const endMid = frequencyToBinIndex(2500, sampleRate, this.fftSize);

    const startTreble = frequencyToBinIndex(2500, sampleRate, this.fftSize);
    const endTreble = frequencyToBinIndex(16000, sampleRate, this.fftSize);

    this.bassBins = [startBass, Math.max(startBass, endBass)];
    this.midBins = [startMid, Math.max(startMid, endMid)];
    this.trebleBins = [startTreble, Math.max(startTreble, endTreble)];
  }

  /**
   * Connects an HTMLAudioElement to the Web Audio pipeline.
  /**
   * Resumes the AudioContext if suspended.
   */
  public async resume(): Promise<void> {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch (err) {
        // Ignored if user has not interacted yet
      }
    }
  }

  /**
   * Connects an HTMLAudioElement to the Web Audio pipeline.
   * Reuses existing MediaElementAudioSourceNode to prevent InvalidStateError.
   */
  public async connectAudioElement(element: HTMLMediaElement): Promise<void> {
    await this.init();
    if (!this.audioCtx || !this.analyser) return;

    // Attach play event listener to resume AudioContext when element starts playing
    element.addEventListener('play', () => {
      this.resume().catch(() => {});
    });

    if (this.activeElement === element) {
      if (this.audioCtx.state === 'suspended') {
        await this.resume();
      }
      return;
    }
    this.activeElement = element;

    let source = this.sourceMap.get(element);
    if (!source) {
      try {
        source = this.audioCtx.createMediaElementSource(element);
        this.sourceMap.set(element, source);
      } catch (err) {
        console.warn('MediaElementSource already connected or failed:', err);
        return;
      }
    }

    try {
      source.disconnect();
      source.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
    } catch (err) {
      console.warn('Error routing audio graph:', err);
    }
  }

  /**
   * Extracts real-time audio metrics, decomposing into Bass, Mid, and Treble
   * with ultra-responsive transient attack and dynamic beat onset detection.
   */
  public getMetrics(): AudioMetrics {
    if (!this.analyser) {
      return this.metrics;
    }

    // Populate buffers from hardware analyser
    this.analyser.getByteFrequencyData(this.frequencyData as unknown as Uint8Array<ArrayBuffer>);
    this.analyser.getByteTimeDomainData(this.waveformData as unknown as Uint8Array<ArrayBuffer>);

    // Determine if audio is actively playing
    const isPlaying = !!(
      this.activeElement &&
      !this.activeElement.paused &&
      !this.activeElement.ended &&
      this.activeElement.readyState >= 2
    );

    // Compute instantaneous band energies (0.0 to 1.0)
    const rawBass = calculateBandEnergy(this.frequencyData, this.bassBins[0], this.bassBins[1]);
    // Apply musical presence boost to mids and treble so all registers have vibrant visual presence
    const rawMid = Math.min(1.0, calculateBandEnergy(this.frequencyData, this.midBins[0], this.midBins[1]) * 1.35);
    const rawTreble = Math.min(1.0, calculateBandEnergy(this.frequencyData, this.trebleBins[0], this.trebleBins[1]) * 2.2);
    // Overall audible energy (focusing on 20Hz - 7.7kHz rather than empty ultrasound)
    const overall = Math.min(1.0, calculateBandEnergy(this.frequencyData, 0, Math.min(180, this.frequencyData.length - 1)) * 1.4);

    // Apply attack/release dynamic smoothing
    // Bass: Rapid attack (0.85) for instant kick sync with 0 delay, snappy release (0.22)
    this.smoothedBass = smoothMetric(this.smoothedBass, rawBass, 0.85, 0.22);
    // Mids: Fluid response for melody / synth sweeps
    this.smoothedMid = smoothMetric(this.smoothedMid, rawMid, 0.75, 0.18);
    // Treble: Snappy response for percussion/hi-hats
    this.smoothedTreble = smoothMetric(this.smoothedTreble, rawTreble, 0.90, 0.25);

    // Real-time Beat Onset Detection (Transient Kick & Snare hits)
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.rollingBassAverage = this.rollingBassAverage * 0.92 + rawBass * 0.08;
    const beatThreshold = Math.max(0.18, this.rollingBassAverage * 1.28);
    const isBeat = rawBass > beatThreshold && (now - this.lastBeatTime > 150);

    let beatIntensity = 0;
    if (isBeat) {
      this.lastBeatTime = now;
      beatIntensity = Math.min(1.0, (rawBass - this.rollingBassAverage) * 2.5 + 0.35);
      this.beatPulse = Math.max(this.beatPulse, beatIntensity);
    } else {
      // Exponential decay of beat pulse
      this.beatPulse = Math.max(0, this.beatPulse * 0.88 - 0.01);
    }

    this.metrics.bass = Math.min(1.0, this.smoothedBass * this.bassMultiplier);
    this.metrics.mid = Math.min(1.0, this.smoothedMid * this.midMultiplier);
    this.metrics.treble = Math.min(1.0, this.smoothedTreble * this.trebleMultiplier);
    this.metrics.rawBass = Math.min(1.0, rawBass * this.bassMultiplier);
    this.metrics.rawMid = Math.min(1.0, rawMid * this.midMultiplier);
    this.metrics.rawTreble = Math.min(1.0, rawTreble * this.trebleMultiplier);
    const avgMultiplier = (this.bassMultiplier + this.midMultiplier + this.trebleMultiplier) / 3;
    this.metrics.overall = Math.min(1.0, overall * avgMultiplier);
    this.metrics.isBeat = isBeat;
    this.metrics.beatIntensity = beatIntensity;
    this.metrics.beatPulse = Math.min(1.0, this.beatPulse * this.bassMultiplier);
    this.metrics.isPlaying = isPlaying;
    this.metrics.frequencyData = this.frequencyData;
    this.metrics.waveform = this.waveformData;

    return this.metrics;
  }

  /**
   * Sets sensitivity multipliers for Bass, Mid, and Treble frequencies (clamped 0.1x to 3.0x).
   */
  public setSensitivity(bass: number, mid: number, treble: number): void {
    this.bassMultiplier = Math.max(0.1, Math.min(3.0, bass));
    this.midMultiplier = Math.max(0.1, Math.min(3.0, mid));
    this.trebleMultiplier = Math.max(0.1, Math.min(3.0, treble));
  }

  /**
   * Returns current sensitivity multipliers.
   */
  public getSensitivity(): { bass: number; mid: number; treble: number } {
    return {
      bass: this.bassMultiplier,
      mid: this.midMultiplier,
      treble: this.trebleMultiplier,
    };
  }

  /**
   * Gets the AudioContext state ('running', 'suspended', 'closed').
   */
  public getContextState(): AudioContextState | 'uninitialized' {
    return this.audioCtx ? this.audioCtx.state : 'uninitialized';
  }

  /**
   * Resets smoothed metrics.
   */
  public resetMetrics(): void {
    this.smoothedBass = 0;
    this.smoothedMid = 0;
    this.smoothedTreble = 0;
    this.rollingBassAverage = 0;
    this.lastBeatTime = 0;
    this.beatPulse = 0;
    this.metrics.bass = 0;
    this.metrics.mid = 0;
    this.metrics.treble = 0;
    this.metrics.rawBass = 0;
    this.metrics.rawMid = 0;
    this.metrics.rawTreble = 0;
    this.metrics.overall = 0;
    this.metrics.isBeat = false;
    this.metrics.beatIntensity = 0;
    this.metrics.beatPulse = 0;
    this.metrics.isPlaying = false;
    this.frequencyData.fill(0);
    this.waveformData.fill(128); // 128 is silence in time-domain 8-bit
  }
}
