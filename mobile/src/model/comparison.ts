export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

export type ViewMode = "equal" | "just" | "both";
export type AudioTemperament = "equal" | "just";
export type NoteName = `${(typeof NOTE_NAMES)[number]}${number}`;

export interface ComparisonState {
  viewMode: ViewMode;
  audioEnabled: boolean;
  audioTemperament: AudioTemperament;
  volume: number;
  xNote: NoteName;
  yNote: NoteName;
}

export interface ComparisonResult {
  xMidi: number;
  yMidi: number;
  semitones: number;
  xFreq: number;
  eqRatio: number;
  justRatio: number;
  justLabel: string;
  equalY: number;
  justY: number;
  hzDelta: number;
  centsDelta: number;
  intervalLabel: string;
}

export interface JustInterval {
  semitones: number;
  name: string;
  ratio: number;
  label: string;
}

export const DEFAULT_COMPARISON_STATE: ComparisonState = {
  viewMode: "both",
  audioEnabled: false,
  audioTemperament: "equal",
  volume: 0.55,
  xNote: "C3",
  yNote: "G3",
};

export const JUST_INTERVALS: readonly JustInterval[] = [
  { semitones: 0, name: "Unison", ratio: 1, label: "1:1" },
  { semitones: 1, name: "Minor second", ratio: 16 / 15, label: "16:15" },
  { semitones: 2, name: "Major second", ratio: 9 / 8, label: "9:8" },
  { semitones: 3, name: "Minor third", ratio: 6 / 5, label: "6:5" },
  { semitones: 4, name: "Major third", ratio: 5 / 4, label: "5:4" },
  { semitones: 5, name: "Perfect fourth", ratio: 4 / 3, label: "4:3" },
  { semitones: 6, name: "Tritone", ratio: 45 / 32, label: "45:32" },
  { semitones: 7, name: "Perfect fifth", ratio: 3 / 2, label: "3:2" },
  { semitones: 8, name: "Minor sixth", ratio: 8 / 5, label: "8:5" },
  { semitones: 9, name: "Major sixth", ratio: 5 / 3, label: "5:3" },
  { semitones: 10, name: "Minor seventh", ratio: 9 / 5, label: "9:5" },
  { semitones: 11, name: "Major seventh", ratio: 15 / 8, label: "15:8" },
  { semitones: 12, name: "Octave", ratio: 2, label: "2:1" },
  { semitones: 13, name: "Minor ninth", ratio: 32 / 15, label: "32:15" },
  { semitones: 14, name: "Major ninth", ratio: 9 / 4, label: "9:4" },
  { semitones: 15, name: "Minor tenth", ratio: 12 / 5, label: "12:5" },
  { semitones: 16, name: "Major tenth", ratio: 5 / 2, label: "5:2" },
  { semitones: 17, name: "Perfect eleventh", ratio: 8 / 3, label: "8:3" },
  { semitones: 18, name: "Tritone + octave", ratio: 45 / 16, label: "45:16" },
  { semitones: 19, name: "Perfect twelfth", ratio: 3, label: "3:1" },
  { semitones: 20, name: "Minor thirteenth", ratio: 16 / 5, label: "16:5" },
  { semitones: 21, name: "Major thirteenth", ratio: 10 / 3, label: "10:3" },
  { semitones: 22, name: "Minor fourteenth", ratio: 18 / 5, label: "18:5" },
  { semitones: 23, name: "Major fourteenth", ratio: 15 / 4, label: "15:4" },
];

export const JUST_BY_SEMITONES = new Map(JUST_INTERVALS.map((interval) => [interval.semitones, interval]));

export const NOTE_RANGE = buildKeyRange(48, 71);

export function buildKeyRange(minMidi: number, maxMidi: number) {
  const notes: Array<{ midi: number; note: NoteName; name: string }> = [];
  for (let midi = minMidi; midi <= maxMidi; midi += 1) {
    notes.push({ midi, note: midiToNote(midi), name: NOTE_NAMES[midi % 12] });
  }
  return notes;
}

export function midiToNote(midi: number): NoteName {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}` as NoteName;
}

export function noteToMidi(note: NoteName): number {
  const octave = Number(note.slice(-1));
  const name = note.slice(0, -1);
  const index = NOTE_NAMES.indexOf(name as (typeof NOTE_NAMES)[number]);
  if (!Number.isFinite(octave) || index < 0) {
    throw new Error(`Unsupported note: ${note}`);
  }
  return (octave + 1) * 12 + index;
}

export function equalFrequency(note: NoteName): number {
  return 440 * Math.pow(2, (noteToMidi(note) - 69) / 12);
}

export function equalRatio(delta: number): number {
  return Math.pow(2, delta / 12);
}

export function signedJustInterval(delta: number) {
  const direction = Math.sign(delta) || 1;
  const abs = Math.abs(delta);
  const base = JUST_BY_SEMITONES.get(abs) ?? JUST_BY_SEMITONES.get(abs % 12) ?? JUST_BY_SEMITONES.get(0)!;
  const octaves = Math.floor(abs / 12);
  const within = abs > 23 ? base.ratio * Math.pow(2, octaves) : base.ratio;
  const ratio = direction < 0 ? 1 / within : within;
  const label = direction < 0 ? invertRatioLabel(base.label) : base.label;
  return { ...base, ratio, label };
}

export function intervalName(delta: number): string {
  const abs = Math.abs(delta);
  const base = JUST_BY_SEMITONES.get(abs) ?? JUST_BY_SEMITONES.get(abs % 12) ?? JUST_BY_SEMITONES.get(0)!;
  if (delta === 0) {
    return base.name;
  }
  return `${base.name} ${delta > 0 ? "up" : "down"}`;
}

export function computeComparison(state: Pick<ComparisonState, "xNote" | "yNote">): ComparisonResult {
  const xMidi = noteToMidi(state.xNote);
  const yMidi = noteToMidi(state.yNote);
  const semitones = yMidi - xMidi;
  const xFreq = equalFrequency(state.xNote);
  const eqRatio = equalRatio(semitones);
  const just = signedJustInterval(semitones);
  const equalY = xFreq * eqRatio;
  const justY = xFreq * just.ratio;
  const centsDelta = 1200 * Math.log2(justY / equalY);
  const hzDelta = justY - equalY;
  return {
    xMidi,
    yMidi,
    semitones,
    xFreq,
    eqRatio,
    justRatio: just.ratio,
    justLabel: just.label,
    equalY,
    justY,
    hzDelta,
    centsDelta,
    intervalLabel: intervalName(semitones),
  };
}

export function audibleYFrequency(
  comparison: Pick<ComparisonResult, "equalY" | "justY">,
  viewMode: ViewMode,
  audioTemperament: AudioTemperament,
) {
  if (viewMode === "equal") {
    return comparison.equalY;
  }
  if (viewMode === "just") {
    return comparison.justY;
  }
  return audioTemperament === "just" ? comparison.justY : comparison.equalY;
}

export function volumeToGain(value: number): number {
  return Math.pow(Math.max(0, Math.min(1, value)), 1.45) * 0.14;
}

export function formatHz(value: number): string {
  return `${value.toFixed(2)} Hz`;
}

export function formatSigned(value: number, unit: string, digits = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)} ${unit}`;
}

function invertRatioLabel(label: string): string {
  const parts = label.split(":");
  return parts.length === 2 ? `${parts[1]}:${parts[0]}` : label;
}
