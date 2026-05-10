import type { AudioTemperament, ComparisonState, ViewMode } from "./comparison";

export type ThemeMode = "light" | "dark";
export type OrientationMode = "portrait" | "landscape";

export interface AppPreferences {
  themeMode: ThemeMode;
  orientationMode: OrientationMode;
}

export interface AppTheme {
  mode: ThemeMode;
  statusBarStyle: "dark" | "light";
  background: string;
  surface: string;
  surfaceRaised: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  primarySoftText: string;
  stop: string;
  equalAccent: string;
  justAccent: string;
  selectedText: string;
  keySharpBackground: string;
  keySharpBorder: string;
  keySharpText: string;
  visualizerBackground: string;
  visualizerGridMinor: string;
  visualizerGridMajor: string;
  visualizerLabelBackground: string;
  shadow: string;
  sliderTrack: string;
}

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  themeMode: "light",
  orientationMode: "portrait",
};

export const THEME_MODE_OPTIONS: Array<{ value: ThemeMode; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export const ORIENTATION_MODE_OPTIONS: Array<{ value: OrientationMode; label: string }> = [
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape" },
];

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

export function shouldUseLandscapeLayout(
  dimensions: Pick<{ width: number; height: number }, "width" | "height">,
  orientationMode: OrientationMode,
): boolean {
  return orientationMode === "landscape" && dimensions.width >= 720 && dimensions.width > dimensions.height;
}

export const APP_THEMES: Record<ThemeMode, AppTheme> = {
  light: {
    mode: "light",
    statusBarStyle: "dark",
    background: "#eef3f8",
    surface: "#ffffff",
    surfaceRaised: "#ffffff",
    surfaceMuted: "#e8edf3",
    border: "#d5dde8",
    text: "#101820",
    textMuted: "#485465",
    textSubtle: "#667386",
    primary: "#2563eb",
    primaryPressed: "#1d4ed8",
    primarySoft: "#eff6ff",
    primarySoftText: "#1d4ed8",
    stop: "#475569",
    equalAccent: "#2563eb",
    justAccent: "#c2410c",
    selectedText: "#ffffff",
    keySharpBackground: "#2a3440",
    keySharpBorder: "#2a3440",
    keySharpText: "#f8fafc",
    visualizerBackground: "#f9fbfe",
    visualizerGridMinor: "#d5deea",
    visualizerGridMajor: "#aebbc9",
    visualizerLabelBackground: "rgba(255,255,255,0.78)",
    shadow: "#1d252f",
    sliderTrack: "#cbd5e1",
  },
  dark: {
    mode: "dark",
    statusBarStyle: "light",
    background: "#101418",
    surface: "#171d24",
    surfaceRaised: "#202832",
    surfaceMuted: "#252f3b",
    border: "#344252",
    text: "#f4f7fb",
    textMuted: "#c2ccd8",
    textSubtle: "#8f9bad",
    primary: "#60a5fa",
    primaryPressed: "#3b82f6",
    primarySoft: "#172a43",
    primarySoftText: "#bfdbfe",
    stop: "#64748b",
    equalAccent: "#38bdf8",
    justAccent: "#f59e0b",
    selectedText: "#07111d",
    keySharpBackground: "#05080c",
    keySharpBorder: "#303b49",
    keySharpText: "#e8edf4",
    visualizerBackground: "#0c1117",
    visualizerGridMinor: "#243140",
    visualizerGridMajor: "#405166",
    visualizerLabelBackground: "rgba(15,23,32,0.84)",
    shadow: "#000000",
    sliderTrack: "#334155",
  },
};
