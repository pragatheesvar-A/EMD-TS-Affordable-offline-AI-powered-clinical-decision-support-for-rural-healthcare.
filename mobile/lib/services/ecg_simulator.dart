// Prototype ECG waveform generator -- produces a stylized PQRST complex
// purely for demonstration. NOT a clinically diagnostic signal. Mirrors
// src/lib/ecgSimulator.ts in the web prototype.

import 'dart:math';

double _gaussian(double x, double mean, double std, double amp) {
  return amp * exp(-pow(x - mean, 2) / (2 * std * std));
}

double _normalBeatShape(double x) {
  return _gaussian(x, 0.14, 0.02, 0.12) + // P wave
      _gaussian(x, 0.27, 0.008, -0.12) + // Q dip
      _gaussian(x, 0.30, 0.009, 1.0) + // R spike
      _gaussian(x, 0.335, 0.011, -0.28) + // S dip
      _gaussian(x, 0.55, 0.07, 0.28); // T wave
}

double _abnormalBeatShape(double x) {
  return _gaussian(x, 0.13, 0.02, 0.08) +
      _gaussian(x, 0.26, 0.014, -0.1) +
      _gaussian(x, 0.30, 0.016, 0.85) +
      _gaussian(x, 0.35, 0.02, -0.15) +
      _gaussian(x, 0.42, 0.03, 0.18) +
      _gaussian(x, 0.60, 0.09, 0.4);
}

class EcgGeneratorState {
  double t = 0;
  int beatIndex = 0;
}

final _rand = Random();

double nextEcgSample(EcgGeneratorState state, double dt, double bpm, bool abnormal) {
  state.t += dt;
  final baseBeatDuration = 60 / bpm;
  double beatDuration = baseBeatDuration;

  if (abnormal) {
    final wobble = sin(state.beatIndex * 1.7) * 0.08;
    beatDuration = baseBeatDuration * (1 + wobble);
  }

  double x = (state.t % beatDuration) / beatDuration;
  if (state.t >= beatDuration) {
    state.t = state.t % beatDuration;
    state.beatIndex += 1;
  }
  x = x.clamp(0.0, 0.999);

  final noise = (_rand.nextDouble() - 0.5) * (abnormal ? 0.035 : 0.015);
  final shape = abnormal ? _abnormalBeatShape(x) : _normalBeatShape(x);
  return shape + noise;
}
