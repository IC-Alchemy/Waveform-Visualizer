import type { AudioTemperament, ComparisonState, ViewMode } from "./comparison";

export const VIEW_MODES: Array<{ value: ViewMode; label: string }> = [
  { value: "equal", label: "Equal" },
  { value: "just", label: "Just" },
  { value: "both", label: "Both" },
];

export const AUDIO_TEMPERAMENTS: Array<{ value: AudioTemperament; label: string }> = [
  { value: "equal", label: "Hear equal" },
  { value: "just", label: "Hear just" },
];

export function visiblePaneLabels(viewMode: ViewMode): string[] {
  if (viewMode === "both") {
    return ["Equal", "Just"];
  }
  return [viewMode === "equal" ? "Equal" : "Just"];
}

export function shouldShowAudioSideSelector(state: Pick<ComparisonState, "viewMode">): boolean {
  return state.viewMode === "both";
}
