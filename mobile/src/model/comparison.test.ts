import { describe, expect, it } from "vitest";
import {
  DEFAULT_COMPARISON_STATE,
  audibleYFrequency,
  computeComparison,
  equalFrequency,
  signedJustInterval,
  volumeToGain,
} from "./comparison";

describe("temperament comparison model", () => {
  it("computes the default C3/G3 perfect fifth", () => {
    const comparison = computeComparison(DEFAULT_COMPARISON_STATE);

    expect(comparison.semitones).toBe(7);
    expect(comparison.intervalLabel).toBe("Perfect fifth up");
    expect(comparison.justLabel).toBe("3:2");
    expect(comparison.eqRatio).toBeCloseTo(1.498307, 6);
    expect(comparison.justRatio).toBe(1.5);
    expect(comparison.xFreq).toBeCloseTo(130.81278, 5);
    expect(comparison.equalY).toBeCloseTo(195.99772, 5);
    expect(comparison.justY).toBeCloseTo(196.21917, 5);
  });

  it("rebuilds just Y from the selected X root", () => {
    const cRoot = computeComparison({ xNote: "C3", yNote: "G3" });
    const dRoot = computeComparison({ xNote: "D3", yNote: "A3" });

    expect(cRoot.justY).toBeCloseTo(cRoot.xFreq * 1.5, 6);
    expect(dRoot.justY).toBeCloseTo(equalFrequency("D3") * 1.5, 6);
    expect(dRoot.justY).not.toBeCloseTo(cRoot.justY, 6);
  });

  it("inverts just ratios for downward intervals", () => {
    const interval = signedJustInterval(-7);
    const comparison = computeComparison({ xNote: "G3", yNote: "C3" });

    expect(interval.label).toBe("2:3");
    expect(interval.ratio).toBeCloseTo(2 / 3, 8);
    expect(comparison.intervalLabel).toBe("Perfect fifth down");
    expect(comparison.justY).toBeCloseTo(comparison.xFreq * (2 / 3), 6);
  });

  it("matches browser cent and hertz delta conventions", () => {
    const comparison = computeComparison({ xNote: "C3", yNote: "E3" });

    expect(comparison.hzDelta).toBeCloseTo(-1.2978, 4);
    expect(comparison.centsDelta).toBeCloseTo(-13.68629, 4);
  });

  it("selects audible Y from view mode and both-mode audio side", () => {
    const comparison = computeComparison(DEFAULT_COMPARISON_STATE);

    expect(audibleYFrequency(comparison, "equal", "just")).toBe(comparison.equalY);
    expect(audibleYFrequency(comparison, "just", "equal")).toBe(comparison.justY);
    expect(audibleYFrequency(comparison, "both", "just")).toBe(comparison.justY);
  });

  it("keeps gain conservative for two oscillators", () => {
    expect(volumeToGain(0)).toBe(0);
    expect(volumeToGain(0.55)).toBeCloseTo(0.0587, 3);
    expect(volumeToGain(1)).toBeCloseTo(0.14, 6);
  });
});
