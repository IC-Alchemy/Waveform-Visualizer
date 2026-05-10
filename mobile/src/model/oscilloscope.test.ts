import { describe, expect, it } from "vitest";
import {
  applyFrequencyMode,
  cloneDefaultState,
  intervalRatio,
  midiToNote,
  noteFrequency,
  noteToMidi,
} from "./oscilloscope";

describe("oscilloscope model", () => {
  it("uses A440 equal temperament note math", () => {
    const state = cloneDefaultState();
    expect(noteToMidi("A4")).toBe(69);
    expect(noteFrequency("A4", state.tuning)).toBeCloseTo(440, 8);
    expect(noteFrequency("C4", state.tuning)).toBeCloseTo(261.625565, 5);
  });

  it("derives interval mode from X by default", () => {
    const state = cloneDefaultState();
    state.x.note = "A2";
    state.tuning.interval = "perfectFifth";
    state.tuning.temperament = "just";
    const next = applyFrequencyMode(state);
    expect(next.y.note).toBe("E3");
    expect(next.x.freq).toBeCloseTo(noteFrequency("A2", state.tuning), 8);
    expect(next.y.freq).toBeCloseTo(noteFrequency("A2", state.tuning) * 1.5, 8);
  });

  it("can derive X from Y when interval mode is anchored to Y", () => {
    const state = cloneDefaultState();
    state.y.note = "E3";
    state.tuning.interval = "perfectFifth";
    const next = applyFrequencyMode(state, "y");
    expect(next.x.note).toBe("A2");
  });

  it("uses equal or just interval ratios", () => {
    expect(intervalRatio("perfectFifth", "just")).toBeCloseTo(1.5, 8);
    expect(intervalRatio("perfectFifth", "equal")).toBeCloseTo(Math.pow(2, 7 / 12), 8);
  });

  it("clamps MIDI notes to the browser range", () => {
    expect(midiToNote(-100)).toBe("C0");
    expect(midiToNote(300)).toBe("B8");
  });
});
