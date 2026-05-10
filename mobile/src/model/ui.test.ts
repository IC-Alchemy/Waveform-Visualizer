import { describe, expect, it } from "vitest";
import {
  DEFAULT_APP_PREFERENCES,
  ORIENTATION_MODE_OPTIONS,
  THEME_MODE_OPTIONS,
  shouldUseLandscapeLayout,
  shouldShowAudioSideSelector,
  visiblePaneLabels,
} from "./ui";

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

  it("defines persisted app preference defaults and option labels", () => {
    expect(DEFAULT_APP_PREFERENCES).toEqual({ themeMode: "light", orientationMode: "portrait" });
    expect(THEME_MODE_OPTIONS).toEqual([
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark" },
    ]);
    expect(ORIENTATION_MODE_OPTIONS).toEqual([
      { value: "portrait", label: "Portrait" },
      { value: "landscape", label: "Landscape" },
    ]);
  });

  it("uses the two-column landscape layout only when there is room", () => {
    expect(shouldUseLandscapeLayout({ width: 900, height: 480 }, "landscape")).toBe(true);
    expect(shouldUseLandscapeLayout({ width: 500, height: 900 }, "landscape")).toBe(false);
    expect(shouldUseLandscapeLayout({ width: 900, height: 480 }, "portrait")).toBe(false);
  });
});
