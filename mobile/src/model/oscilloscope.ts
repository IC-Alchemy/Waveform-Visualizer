export type Axis = "x" | "y";
export type FrequencyMode = "hz" | "note" | "interval";
export type Temperament = "equal" | "just";
export type TraceStyle = "hybrid" | "points" | "lines";
export type Waveform = 0 | 1 | 2 | 3;

export interface OscillatorState {
  wave: Waveform;
  freq: number;
  amp: number;
  phase: number;
  offset: number;
  note: string;
}

export interface TuningState {
  freqMode: FrequencyMode;
  interval: string;
  temperament: Temperament;
  referenceFreq: number;
}

export interface ScopeState {
  x: OscillatorState;
  y: OscillatorState;
  tuning: TuningState;
  persistence: number;
  intensity: number;
  focus: number;
  traceAntialias: number;
  traceStyle: TraceStyle;
  phosphorColor: string;
  decay: number;
  bloom: number;
  window: number;
  samples: number;
  exportScale: number;
  exportSamples: number;
  frozen: boolean;
}

export interface IntervalDefinition {
  value: string;
  label: string;
  semitones: number;
  just: number;
}

export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const JUST_NOTE_RATIOS = [1, 16 / 15, 9 / 8, 6 / 5, 5 / 4, 4 / 3, 45 / 32, 3 / 2, 8 / 5, 5 / 3, 9 / 5, 15 / 8];
export const C4_EQUAL_FREQ = 440 * Math.pow(2, -9 / 12);
export const MIN_NOTE_MIDI = 12;
export const MAX_NOTE_MIDI = 119;
export const MIN_FREQUENCY = 0.1;
export const MAX_FREQUENCY = 520;

export const WAVEFORMS: Array<{ value: Waveform; label: string }> = [
  { value: 0, label: "Sine" },
  { value: 1, label: "Triangle" },
  { value: 2, label: "Soft square" },
  { value: 3, label: "Saw" },
];

export const INTERVALS: IntervalDefinition[] = [
  { value: "unison", label: "Unison", semitones: 0, just: 1 },
  { value: "minorSecond", label: "Minor second", semitones: 1, just: 16 / 15 },
  { value: "majorSecond", label: "Major second", semitones: 2, just: 9 / 8 },
  { value: "minorThird", label: "Minor third", semitones: 3, just: 6 / 5 },
  { value: "majorThird", label: "Major third", semitones: 4, just: 5 / 4 },
  { value: "perfectFourth", label: "Perfect fourth", semitones: 5, just: 4 / 3 },
  { value: "tritone", label: "Tritone", semitones: 6, just: 45 / 32 },
  { value: "perfectFifth", label: "Perfect fifth", semitones: 7, just: 3 / 2 },
  { value: "minorSixth", label: "Minor sixth", semitones: 8, just: 8 / 5 },
  { value: "majorSixth", label: "Major sixth", semitones: 9, just: 5 / 3 },
  { value: "minorSeventh", label: "Minor seventh", semitones: 10, just: 9 / 5 },
  { value: "majorSeventh", label: "Major seventh", semitones: 11, just: 15 / 8 },
  { value: "octave", label: "Octave", semitones: 12, just: 2 },
  { value: "minorNinth", label: "Minor ninth", semitones: 13, just: 32 / 15 },
  { value: "majorNinth", label: "Major ninth", semitones: 14, just: 9 / 4 },
  { value: "minorTenth", label: "Minor tenth", semitones: 15, just: 12 / 5 },
  { value: "majorTenth", label: "Major tenth", semitones: 16, just: 5 / 2 },
  { value: "perfectEleventh", label: "Perfect eleventh", semitones: 17, just: 8 / 3 },
  { value: "compoundTritone", label: "Tritone + octave", semitones: 18, just: 45 / 16 },
  { value: "perfectTwelfth", label: "Perfect twelfth", semitones: 19, just: 3 },
  { value: "minorThirteenth", label: "Minor thirteenth", semitones: 20, just: 16 / 5 },
  { value: "majorThirteenth", label: "Major thirteenth", semitones: 21, just: 10 / 3 },
  { value: "minorFourteenth", label: "Minor fourteenth", semitones: 22, just: 18 / 5 },
  { value: "majorFourteenth", label: "Major fourteenth", semitones: 23, just: 15 / 4 },
  { value: "twoOctaves", label: "Two octaves", semitones: 24, just: 4 },
];

export const INTERVAL_BY_VALUE = new Map(INTERVALS.map((interval) => [interval.value, interval]));

export const NOTE_OPTIONS = Array.from({ length: 9 * NOTE_NAMES.length }, (_, index) => {
  const octave = Math.floor(index / NOTE_NAMES.length);
  return `${NOTE_NAMES[index % NOTE_NAMES.length]}${octave}`;
});

export const DEFAULT_SCOPE_STATE: ScopeState = {
  x: { wave: 0, freq: 110, amp: 0.74, phase: 0, offset: 0, note: "A2" },
  y: { wave: 0, freq: 164.81377845643496, amp: 0.74, phase: 90, offset: 0, note: "E3" },
  tuning: { freqMode: "interval", interval: "perfectFifth", temperament: "equal", referenceFreq: 110 },
  persistence: 0.972,
  intensity: 0.32,
  focus: 2.4,
  traceAntialias: 0.54,
  traceStyle: "hybrid",
  phosphorColor: "#5cff9f",
  decay: 0.96,
  bloom: 0.82,
  window: 0.032,
  samples: 8192,
  exportScale: 2,
  exportSamples: 32768,
  frozen: false,
};

export function cloneDefaultState(): ScopeState {
  return {
    ...DEFAULT_SCOPE_STATE,
    x: { ...DEFAULT_SCOPE_STATE.x },
    y: { ...DEFAULT_SCOPE_STATE.y },
    tuning: { ...DEFAULT_SCOPE_STATE.tuning },
  };
}

export function clampFrequency(value: number, fallback = DEFAULT_SCOPE_STATE.tuning.referenceFreq) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(MAX_FREQUENCY, Math.max(MIN_FREQUENCY, value));
}

export function noteToMidi(note: string) {
  const octave = Number(note.slice(-1));
  const name = note.slice(0, -1);
  const noteIndex = NOTE_NAMES.indexOf(name);
  if (noteIndex < 0 || !Number.isFinite(octave)) {
    return -1;
  }
  return (octave + 1) * 12 + noteIndex;
}

export function midiToNote(midi: number) {
  const clamped = Math.min(MAX_NOTE_MIDI, Math.max(MIN_NOTE_MIDI, Math.round(midi)));
  return `${NOTE_NAMES[clamped % 12]}${Math.floor(clamped / 12) - 1}`;
}

export function noteFrequency(note: string, tuning: TuningState) {
  const midi = noteToMidi(note);
  if (midi < 0) {
    return tuning.referenceFreq;
  }
  const noteIndex = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  if (tuning.temperament === "just") {
    return C4_EQUAL_FREQ * Math.pow(2, octave - 4) * JUST_NOTE_RATIOS[noteIndex];
  }
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function intervalRatio(value: string, temperament: Temperament) {
  const interval = INTERVAL_BY_VALUE.get(value) || INTERVALS[0];
  return temperament === "just" ? interval.just : Math.pow(2, interval.semitones / 12);
}

export function applyFrequencyMode(state: ScopeState, anchor: Axis = "x") {
  const next = cloneState(state);
  if (next.tuning.freqMode === "note") {
    next.x.freq = clampFrequency(noteFrequency(next.x.note, next.tuning), next.x.freq);
    next.y.freq = clampFrequency(noteFrequency(next.y.note, next.tuning), next.y.freq);
    return next;
  }
  if (next.tuning.freqMode === "interval") {
    return applyIntervalMode(next, anchor);
  }
  next.x.freq = clampFrequency(next.x.freq, next.x.freq);
  next.y.freq = clampFrequency(next.y.freq, next.y.freq);
  return next;
}

export function applyIntervalMode(state: ScopeState, anchor: Axis = "x") {
  const next = cloneState(state);
  const interval = INTERVAL_BY_VALUE.get(next.tuning.interval) || INTERVALS[0];
  if (anchor === "y") {
    next.x.note = midiToNote(noteToMidi(next.y.note) - interval.semitones);
  } else {
    next.y.note = midiToNote(noteToMidi(next.x.note) + interval.semitones);
  }
  next.x.freq = clampFrequency(noteFrequency(next.x.note, next.tuning), next.x.freq);
  next.y.freq = clampFrequency(next.x.freq * intervalRatio(next.tuning.interval, next.tuning.temperament), next.y.freq);
  return next;
}

export function cloneState(state: ScopeState): ScopeState {
  return {
    ...state,
    x: { ...state.x },
    y: { ...state.y },
    tuning: { ...state.tuning },
  };
}

export function updateOscillator(state: ScopeState, axis: Axis, patch: Partial<OscillatorState>) {
  const next = cloneState(state);
  next[axis] = { ...next[axis], ...patch };
  return next;
}

export function formatFrequency(value: number) {
  return `${value.toFixed(2)} Hz`;
}

export function formatRatio(x: number, y: number) {
  return `1:${(y / Math.max(x, 0.000001)).toFixed(3)}`;
}
