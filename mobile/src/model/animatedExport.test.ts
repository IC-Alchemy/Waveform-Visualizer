import { describe, expect, it } from "vitest";
import {
  ANIMATED_EXPORT_DURATIONS,
  animatedExportLabel,
  buildAnimatedExportPlan,
  bytesToBase64,
} from "./animatedExport";

describe("animated export helpers", () => {
  it("offers the requested Android share durations", () => {
    expect(ANIMATED_EXPORT_DURATIONS).toEqual([3, 5, 10]);
  });

  it("builds a smoother frame plan for mobile GIF export", () => {
    expect(buildAnimatedExportPlan(3)).toMatchObject({ durationSeconds: 3, frameRate: 24, frameCount: 72, frameDelayMs: 42 });
    expect(buildAnimatedExportPlan(5)).toMatchObject({ durationSeconds: 5, frameRate: 24, frameCount: 120, frameDelayMs: 42 });
    expect(buildAnimatedExportPlan(10)).toMatchObject({ durationSeconds: 10, frameRate: 24, frameCount: 240, frameDelayMs: 42 });
  });

  it("rejects unsupported durations", () => {
    expect(() => buildAnimatedExportPlan(4)).toThrow("Unsupported animated export duration");
  });

  it("formats labels for the duration segmented control", () => {
    expect(animatedExportLabel(5)).toBe("5 sec GIF");
  });

  it("encodes binary GIF bytes as base64 for expo-file-system", () => {
    expect(bytesToBase64(new Uint8Array([71, 73, 70]))).toBe("R0lG");
  });
});
