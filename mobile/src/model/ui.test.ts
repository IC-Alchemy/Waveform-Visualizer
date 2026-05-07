import { describe, expect, it } from "vitest";
import { shouldShowAudioSideSelector, visiblePaneLabels } from "./ui";

describe("ui state helpers", () => {
  it("stacks two panes in both mode", () => {
    expect(visiblePaneLabels("both")).toEqual(["Equal", "Just"]);
  });

  it("shows one pane for single temperament modes", () => {
    expect(visiblePaneLabels("equal")).toEqual(["Equal"]);
    expect(visiblePaneLabels("just")).toEqual(["Just"]);
  });

  it("only exposes the audio side selector in both mode", () => {
    expect(shouldShowAudioSideSelector({ viewMode: "both" })).toBe(true);
    expect(shouldShowAudioSideSelector({ viewMode: "equal" })).toBe(false);
  });
});
