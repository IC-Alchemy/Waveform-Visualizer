import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ScreenOrientation from "expo-screen-orientation";
import * as SystemUI from "expo-system-ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  APP_THEMES,
  DEFAULT_APP_PREFERENCES,
  type AppPreferences,
  type OrientationMode,
  type ThemeMode,
} from "../model/ui";

const STORAGE_KEY = "interval-temperament:app-preferences:v1";

export function useAppPreferences() {
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_APP_PREFERENCES);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState("Configuration ready.");

  useEffect(() => {
    let active = true;

    async function loadPreferences() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!active) {
          return;
        }
        setPreferences(parsePreferences(raw));
        setStatus("Configuration loaded.");
      } catch {
        if (active) {
          setStatus("Configuration storage is unavailable; using defaults.");
        }
      } finally {
        if (active) {
          setLoaded(true);
        }
      }
    }

    loadPreferences();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(APP_THEMES[preferences.themeMode].background).catch(() => {
      setStatus("Theme applied inside the app; Android system background could not update.");
    });
  }, [preferences.themeMode]);

  useEffect(() => {
    const lock =
      preferences.orientationMode === "landscape"
        ? ScreenOrientation.OrientationLock.LANDSCAPE
        : ScreenOrientation.OrientationLock.PORTRAIT_UP;

    ScreenOrientation.lockAsync(lock)
      .then(() => setStatus(`${capitalize(preferences.orientationMode)} mode applied.`))
      .catch(() => setStatus(`${capitalize(preferences.orientationMode)} mode is selected, but Android could not lock it.`));
  }, [preferences.orientationMode]);

  const persistPreferences = useCallback((next: AppPreferences) => {
    setPreferences(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
      setStatus("Configuration changed for this session, but could not be saved.");
    });
  }, []);

  const setThemeMode = useCallback(
    (themeMode: ThemeMode) => {
      persistPreferences({ ...preferences, themeMode });
    },
    [persistPreferences, preferences],
  );

  const setOrientationMode = useCallback(
    (orientationMode: OrientationMode) => {
      persistPreferences({ ...preferences, orientationMode });
    },
    [persistPreferences, preferences],
  );

  const theme = useMemo(() => APP_THEMES[preferences.themeMode], [preferences.themeMode]);

  return {
    loaded,
    preferences,
    preferenceStatus: status,
    setOrientationMode,
    setThemeMode,
    theme,
  };
}

function parsePreferences(raw: string | null): AppPreferences {
  if (!raw) {
    return DEFAULT_APP_PREFERENCES;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppPreferences>;
    return {
      themeMode: parsed.themeMode === "dark" || parsed.themeMode === "light" ? parsed.themeMode : "light",
      orientationMode:
        parsed.orientationMode === "landscape" || parsed.orientationMode === "portrait"
          ? parsed.orientationMode
          : "portrait",
    };
  } catch {
    return DEFAULT_APP_PREFERENCES;
  }
}

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
