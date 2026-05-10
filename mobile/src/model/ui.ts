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
  surfaceControl: string;
  surfaceControlMuted: string;
  border: string;
  divider: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  primarySoftText: string;
  buttonDisabled: string;
  buttonDisabledText: string;
  stop: string;
  equalAccent: string;
  justAccent: string;
  selectedText: string;
  keySharpBackground: string;
  keySharpBorder: string;
  keySharpText: string;
  visualizerBackground: string;
  visualizerFrame: string;
  visualizerGridMinor: string;
  visualizerGridMajor: string;
  visualizerLabelBackground: string;
  traceGlowEqual: string;
  traceGlowJust: string;
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
    background: "#e9eef4",
    surface: "#f8fbff",
    surfaceRaised: "#ffffff",
    surfaceMuted: "#dfe7f0",
    surfaceControl: "#f3f7fb",
    surfaceControlMuted: "#e6edf6",
    border: "#c7d1df",
    divider: "#d9e1eb",
    text: "#0b1420",
    textMuted: "#435064",
    textSubtle: "#6a7688",
    primary: "#0891b2",
    primaryPressed: "#0e7490",
    primarySoft: "#e0f7fb",
    primarySoftText: "#075985",
    buttonDisabled: "#cdd7e3",
    buttonDisabledText: "#718095",
    stop: "#536070",
    equalAccent: "#06b6d4",
    justAccent: "#e11d74",
    selectedText: "#ffffff",
    keySharpBackground: "#101827",
    keySharpBorder: "#273449",
    keySharpText: "#eef6ff",
    visualizerBackground: "#04070d",
    visualizerFrame: "#17263a",
    visualizerGridMinor: "rgba(92,126,159,0.24)",
    visualizerGridMajor: "rgba(148,181,214,0.42)",
    visualizerLabelBackground: "rgba(6,13,24,0.82)",
    traceGlowEqual: "rgba(6,182,212,0.28)",
    traceGlowJust: "rgba(225,29,116,0.26)",
    shadow: "#0b1220",
    sliderTrack: "#b8c5d5",
  },
  dark: {
    mode: "dark",
    statusBarStyle: "light",
    background: "#05070c",
    surface: "#0b1018",
    surfaceRaised: "#111927",
    surfaceMuted: "#141e2d",
    surfaceControl: "#0f1724",
    surfaceControlMuted: "#172234",
    border: "#24344b",
    divider: "#1c2a3d",
    text: "#f4f8ff",
    textMuted: "#c1ccda",
    textSubtle: "#8797ac",
    primary: "#67e8f9",
    primaryPressed: "#22d3ee",
    primarySoft: "#0e2b39",
    primarySoftText: "#a5f3fc",
    buttonDisabled: "#263448",
    buttonDisabledText: "#718095",
    stop: "#475569",
    equalAccent: "#67e8f9",
    justAccent: "#fb4f9a",
    selectedText: "#07111d",
    keySharpBackground: "#05070d",
    keySharpBorder: "#34445e",
    keySharpText: "#e8f3ff",
    visualizerBackground: "#030509",
    visualizerFrame: "#1c2a3f",
    visualizerGridMinor: "rgba(72,103,140,0.28)",
    visualizerGridMajor: "rgba(132,162,196,0.5)",
    visualizerLabelBackground: "rgba(3,7,13,0.86)",
    traceGlowEqual: "rgba(103,232,249,0.34)",
    traceGlowJust: "rgba(251,79,154,0.3)",
    shadow: "#000000",
    sliderTrack: "#314158",
  },
};
