/**
 * Formats a duration in seconds into MM:SS format.
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats byte size into human readable string (KB, MB, etc.)
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Validates whether an uploaded file is a supported audio format.
 */
export function validateAudioFile(file: File): { isValid: boolean; error?: string } {
  const allowedExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac'];
  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
  const isAudioMime = file.type.startsWith('audio/') || file.type === '';

  if (!hasValidExtension && !isAudioMime) {
    return {
      isValid: false,
      error: `Unsupported format "${file.name}". Please provide an MP3, WAV, OGG, FLAC, or M4A file.`
    };
  }

  // Maximum file size check (150 MB safety ceiling for browser memory)
  const maxBytes = 150 * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      isValid: false,
      error: `File is too large (${formatBytes(file.size)}). Maximum recommended size is 150 MB.`
    };
  }

  return { isValid: true };
}

/**
 * Procedurally generates a short Synthwave Cyberpunk audio loop as a WAV Blob
 * using OfflineAudioContext. Contains an 80s bassline, driving kick, snare,
 * and a pulsating analog synthesizer arpeggio at 120 BPM.
 */
export async function generateSynthwaveDemoTrack(): Promise<Blob> {
  const sampleRate = 44100;
  const bpm = 120;
  const beatDuration = 60 / bpm; // 0.5s per beat
  const totalBars = 4;
  const totalBeats = totalBars * 4; // 16 beats = 8.0s loop
  const totalDuration = totalBeats * beatDuration;

  // Use OfflineAudioContext for instantaneous rendering
  const offlineCtx = new (window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext)(
    2,
    Math.ceil(sampleRate * totalDuration),
    sampleRate
  );

  // Master bus with mild saturation
  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(0.85, 0);
  masterGain.connect(offlineCtx.destination);

  // Synthwave notes (Root = C minor / A minor cyberpunk vibe):
  // Chord progression: Am -> F -> C -> G
  // Notes in Hz:
  const chordNotes = [
    [110, 164.81, 220, 261.63], // Am (A2, E3, A3, C4)
    [87.31, 130.81, 174.61, 261.63], // F (F2, C3, F3, C4)
    [65.41, 130.81, 196.00, 261.63], // C (C2, C3, G3, C4)
    [98.00, 146.83, 196.00, 293.66], // G (G2, D3, G3, D4)
  ];

  // 1. Bass & Arpeggio Synthesizer
  const sixteenthNote = beatDuration / 4; // 0.125s
  const total16ths = totalBeats * 4;

  for (let step = 0; step < total16ths; step++) {
    const time = step * sixteenthNote;
    const bar = Math.floor(step / 16);
    const chord = chordNotes[bar % 4];
    const noteFreq = chord[step % 4] * 1.5; // Arpeggio pattern

    // 16th note synth stab
    const osc = offlineCtx.createOscillator();
    const filter = offlineCtx.createBiquadFilter();
    const noteGain = offlineCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(noteFreq, time);

    // Neon low-pass sweep
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800 + Math.sin(time * 3) * 600, time);
    filter.frequency.exponentialRampToValueAtTime(200, time + sixteenthNote);
    filter.Q.value = 4.0;

    // Snappy envelope
    noteGain.gain.setValueAtTime(0.28, time);
    noteGain.gain.exponentialRampToValueAtTime(0.001, time + sixteenthNote * 0.95);

    osc.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(masterGain);

    osc.start(time);
    osc.stop(time + sixteenthNote);
  }

  // 2. Heavy 80s Synthwave Bassline (Pumping 8th notes)
  const eighthNote = beatDuration / 2;
  const total8ths = totalBeats * 2;
  for (let step = 0; step < total8ths; step++) {
    const time = step * eighthNote;
    const bar = Math.floor(step / 8);
    const rootBass = chordNotes[bar % 4][0]; // Root frequency

    const bassOsc = offlineCtx.createOscillator();
    const bassGain = offlineCtx.createGain();
    const bassFilter = offlineCtx.createBiquadFilter();

    bassOsc.type = 'sawtooth';
    bassOsc.frequency.setValueAtTime(rootBass, time);

    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(450, time);
    bassFilter.frequency.exponentialRampToValueAtTime(120, time + eighthNote * 0.8);

    bassGain.gain.setValueAtTime(0.35, time);
    bassGain.gain.exponentialRampToValueAtTime(0.01, time + eighthNote * 0.9);

    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(masterGain);

    bassOsc.start(time);
    bassOsc.stop(time + eighthNote);
  }

  // 3. Synthwave Drum Beat (Four-on-the-floor Kick + 80s Snare on 2 and 4)
  for (let beat = 0; beat < totalBeats; beat++) {
    const time = beat * beatDuration;

    // Kick Drum (Every beat)
    const kickOsc = offlineCtx.createOscillator();
    const kickGain = offlineCtx.createGain();

    kickOsc.frequency.setValueAtTime(150, time);
    kickOsc.frequency.exponentialRampToValueAtTime(35, time + 0.12);

    kickGain.gain.setValueAtTime(0.8, time);
    kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    kickOsc.connect(kickGain);
    kickGain.connect(masterGain);

    kickOsc.start(time);
    kickOsc.stop(time + 0.25);

    // Snare Drum (Beats 2 and 4 in each bar)
    const beatInBar = beat % 4;
    if (beatInBar === 1 || beatInBar === 3) {
      // Noise burst for snare
      const bufferSize = sampleRate * 0.2;
      const noiseBuffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = offlineCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const snareFilter = offlineCtx.createBiquadFilter();
      snareFilter.type = 'highpass';
      snareFilter.frequency.setValueAtTime(1000, time);

      const snareGain = offlineCtx.createGain();
      snareGain.gain.setValueAtTime(0.4, time);
      snareGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      whiteNoise.connect(snareFilter);
      snareFilter.connect(snareGain);
      snareGain.connect(masterGain);

      whiteNoise.start(time);
      whiteNoise.stop(time + 0.18);
    }
  }

  // Render audio to AudioBuffer
  const renderedBuffer = await offlineCtx.startRendering();

  // Encode AudioBuffer to WAV format
  return audioBufferToWavBlob(renderedBuffer);
}

/**
 * Converts an AudioBuffer into a binary standard WAV file Blob.
 */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // Helper write string
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF identifier
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');

  // fmt chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data chunk
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  // Interleave channel samples and clamp 16-bit PCM
  let offset = 44;
  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = channels[ch][i];
      // Clamp between -1.0 and 1.0
      sample = Math.max(-1, Math.min(1, sample));
      // Convert to 16-bit signed integer (-32768 to 32767)
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}
