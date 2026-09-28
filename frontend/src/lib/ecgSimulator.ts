// ============================================================
// Prototype ECG waveform generator.
// Produces a stylized PQRST complex purely for demonstration —
// NOT a clinically diagnostic signal.
// ============================================================

function gaussian(x: number, mean: number, std: number, amp: number): number {
  return amp * Math.exp(-((x - mean) ** 2) / (2 * std * std));
}

/** Returns a normalized voltage value for a beat-phase x in [0,1). */
function normalBeatShape(x: number): number {
  return (
    gaussian(x, 0.14, 0.02, 0.12) + // P wave
    gaussian(x, 0.27, 0.008, -0.12) + // Q dip
    gaussian(x, 0.3, 0.009, 1.0) + // R spike
    gaussian(x, 0.335, 0.011, -0.28) + // S dip
    gaussian(x, 0.55, 0.07, 0.28) // T wave
  );
}

/** Abnormal beat: widened QRS, ST elevation, taller/asymmetric T wave. */
function abnormalBeatShape(x: number): number {
  return (
    gaussian(x, 0.13, 0.02, 0.08) + // diminished P wave
    gaussian(x, 0.26, 0.014, -0.1) + // Q dip
    gaussian(x, 0.3, 0.016, 0.85) + // widened R spike
    gaussian(x, 0.35, 0.02, -0.15) + // S dip
    gaussian(x, 0.42, 0.03, 0.18) + // ST elevation bump
    gaussian(x, 0.6, 0.09, 0.4) // exaggerated T wave
  );
}

export interface EcgGeneratorState {
  /** seconds of simulated time elapsed */
  t: number;
  beatIndex: number;
}

export function createEcgState(): EcgGeneratorState {
  return { t: 0, beatIndex: 0 };
}

/**
 * Advances simulated time by dt seconds and returns the next voltage sample.
 * bpm controls beat frequency; abnormal toggles the abnormal waveform +
 * mild rhythm irregularity (simulating an ectopic-like beat every ~7 beats).
 */
export function nextEcgSample(
  state: EcgGeneratorState,
  dt: number,
  bpm: number,
  abnormal: boolean
): number {
  state.t += dt;
  const baseBeatDuration = 60 / bpm;
  let beatDuration = baseBeatDuration;

  if (abnormal) {
    // introduce mild rhythm irregularity
    const wobble = Math.sin(state.beatIndex * 1.7) * 0.08;
    beatDuration = baseBeatDuration * (1 + wobble);
  }

  let x = (state.t % beatDuration) / beatDuration;
  if (state.t >= beatDuration) {
    state.t = state.t % beatDuration;
    state.beatIndex += 1;
  }
  x = Math.max(0, Math.min(0.999, x));

  const noise = (Math.random() - 0.5) * (abnormal ? 0.035 : 0.015);
  const shape = abnormal ? abnormalBeatShape(x) : normalBeatShape(x);
  return shape + noise;
}

/** Pre-generates a static strip of samples (used for the initial paint). */
export function generateEcgStrip(seconds: number, sampleRate: number, bpm: number, abnormal: boolean): number[] {
  const state = createEcgState();
  const dt = 1 / sampleRate;
  const samples: number[] = [];
  const total = Math.floor(seconds * sampleRate);
  for (let i = 0; i < total; i++) {
    samples.push(nextEcgSample(state, dt, bpm, abnormal));
  }
  return samples;
}
