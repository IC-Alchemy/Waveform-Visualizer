import Slider from "@react-native-community/slider";
import { GIFEncoder, applyPalette, quantize } from "gifenc";
import { StatusBar } from "expo-status-bar";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { NoteSelector } from "./src/components/NoteSelector";
import { ReadoutPanel } from "./src/components/ReadoutPanel";
import { SegmentedControl } from "./src/components/SegmentedControl";
import { Visualizer, type VisualizerHandle } from "./src/components/Visualizer";
import { useAppPreferences } from "./src/hooks/useAppPreferences";
import { useAudioEngine } from "./src/hooks/useAudioEngine";
import {
  DEFAULT_COMPARISON_STATE,
  computeComparison,
  type AudioTemperament,
  type ComparisonState,
  type NoteName,
  type ViewMode,
} from "./src/model/comparison";
import {
  ANIMATED_EXPORT_OPTIONS,
  ANIMATED_EXPORT_STATUS_TEXT,
  buildAnimatedExportPlan,
  bytesToBase64,
  type AnimatedExportDuration,
} from "./src/model/animatedExport";
import {
  AUDIO_TEMPERAMENTS,
  ORIENTATION_MODE_OPTIONS,
  THEME_MODE_OPTIONS,
  VIEW_MODES,
  shouldShowAudioSideSelector,
  shouldUseLandscapeLayout,
} from "./src/model/ui";

export default function App() {
  const [state, setState] = useState<ComparisonState>(DEFAULT_COMPARISON_STATE);
  const [readoutsOpen, setReadoutsOpen] = useState(true);
  const [exportStatus, setExportStatus] = useState("Share exports the current visualizer canvas as PNG.");
  const [animatedDuration, setAnimatedDuration] = useState<AnimatedExportDuration>(5);
  const [animatedExporting, setAnimatedExporting] = useState(false);
  const dimensions = useWindowDimensions();
  const { loaded, preferences, preferenceStatus, setOrientationMode, setThemeMode, theme } = useAppPreferences();
  const visualizerRef = useRef<VisualizerHandle>(null);
  const comparison = useMemo(() => computeComparison(state), [state.xNote, state.yNote]);
  const useLandscapeLayout = shouldUseLandscapeLayout(dimensions, preferences.orientationMode);
  const visualizerHeight = useMemo(() => {
    if (useLandscapeLayout) {
      return Math.max(300, Math.min(560, dimensions.height - 76));
    }
    return Math.max(280, Math.min(360, dimensions.height * 0.38));
  }, [dimensions.height, useLandscapeLayout]);
  const audio = useAudioEngine({
    comparison,
    viewMode: state.viewMode,
    audioTemperament: state.audioTemperament,
    volume: state.volume,
  });

  const updateState = <K extends keyof ComparisonState>(key: K, value: ComparisonState[K]) => {
    setState((current) => ({ ...current, [key]: value }));
  };

  const setViewMode = (viewMode: ViewMode) => {
    setState((current) => ({
      ...current,
      viewMode,
      audioTemperament: viewMode === "both" ? current.audioTemperament : viewMode,
    }));
  };

  const toggleAudio = async () => {
    try {
      if (state.audioEnabled) {
        await audio.disable();
        updateState("audioEnabled", false);
        return;
      }
      await audio.enable();
      updateState("audioEnabled", true);
    } catch (error) {
      Alert.alert("Audio could not start", error instanceof Error ? error.message : "Unknown audio error.");
    }
  };

  const shareImage = async () => {
    try {
      setExportStatus("Rendering PNG...");
      const base64 = await visualizerRef.current?.capturePngBase64();
      if (!base64) {
        throw new Error("No visualizer image was captured.");
      }
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        throw new Error("Android sharing is not available in this runtime.");
      }
      const safeStamp = new Date().toISOString().replace(/[:.]/g, "-");
      const uri = `${FileSystem.cacheDirectory ?? ""}interval-temperament-${safeStamp}.png`;
      if (!FileSystem.cacheDirectory) {
        throw new Error("Cache directory is unavailable.");
      }
      await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Share comparison PNG",
      });
      setExportStatus("PNG sent to Android share sheet.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export failed.";
      setExportStatus(message);
      Alert.alert("Export failed", message);
    }
  };

  const shareAnimation = async () => {
    try {
      setAnimatedExporting(true);
      const plan = buildAnimatedExportPlan(animatedDuration);
      setExportStatus(ANIMATED_EXPORT_STATUS_TEXT.rendering);
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        throw new Error("Android sharing is not available in this runtime.");
      }
      if (!FileSystem.cacheDirectory) {
        throw new Error("Cache directory is unavailable.");
      }

      const gif = GIFEncoder({ initialCapacity: 1024 * 1024 });
      for (const frame of plan.frames) {
        setExportStatus(`Capturing frame ${frame.index + 1} of ${plan.frameCount}...`);
        const captured = await visualizerRef.current?.captureRgbaFrame();
        if (!captured) {
          throw new Error("No visualizer frame was captured.");
        }
        const palette = quantize(captured.pixels, 128, { format: "rgb565" });
        const indexed = applyPalette(captured.pixels, palette);
        gif.writeFrame(indexed, captured.width, captured.height, {
          palette,
          delay: plan.frameDelayMs,
          repeat: 0,
        });
        if (frame.index < plan.frameCount - 1) {
          await wait(plan.frameDelayMs);
        }
      }

      setExportStatus(ANIMATED_EXPORT_STATUS_TEXT.encoding);
      gif.finish();
      const safeStamp = new Date().toISOString().replace(/[:.]/g, "-");
      const uri = `${FileSystem.cacheDirectory}interval-temperament-${safeStamp}.${plan.fileExtension}`;
      await FileSystem.writeAsStringAsync(uri, bytesToBase64(gif.bytes()), { encoding: FileSystem.EncodingType.Base64 });
      setExportStatus(ANIMATED_EXPORT_STATUS_TEXT.sharing);
      await Sharing.shareAsync(uri, {
        mimeType: plan.mimeType,
        dialogTitle: plan.shareDialogTitle,
      });
      setExportStatus(ANIMATED_EXPORT_STATUS_TEXT.done);
    } catch (error) {
      const message = error instanceof Error ? error.message : ANIMATED_EXPORT_STATUS_TEXT.error;
      setExportStatus(message);
      Alert.alert("Animated export failed", message);
    } finally {
      setAnimatedExporting(false);
    }
  };

  const sectionStyle = [styles.section, { backgroundColor: theme.surface, borderColor: theme.border }];
  const sectionTitleStyle = [styles.sectionTitle, { color: theme.text }];
  const statusTextStyle = [styles.statusText, { color: theme.textSubtle }];
  const configurationStatus = loaded ? preferenceStatus : "Loading configuration...";

  const header = (
    <View style={styles.header}>
      <Text style={[styles.title, { color: theme.text }]}>Interval Temperament</Text>
      <Text style={[styles.subtitle, { color: theme.textSubtle }]}>
        Native Android comparison of equal temperament and just intonation.
      </Text>
    </View>
  );

  const controls = (
    <View style={styles.controlStack}>
      <View style={sectionStyle}>
        <Text style={sectionTitleStyle}>Configuration</Text>
        <SegmentedControl options={THEME_MODE_OPTIONS} value={preferences.themeMode} onChange={setThemeMode} theme={theme} />
        <SegmentedControl
          options={ORIENTATION_MODE_OPTIONS}
          value={preferences.orientationMode}
          onChange={setOrientationMode}
          theme={theme}
        />
        <Text style={statusTextStyle}>{configurationStatus}</Text>
      </View>

      <View style={sectionStyle}>
        <Text style={sectionTitleStyle}>Visual comparison</Text>
        <SegmentedControl options={VIEW_MODES} value={state.viewMode} onChange={setViewMode} theme={theme} />
      </View>

      <View style={sectionStyle}>
        <NoteSelector
          label="X root"
          value={state.xNote}
          accentColor={theme.equalAccent}
          onChange={(note: NoteName) => updateState("xNote", note)}
          theme={theme}
        />
        <NoteSelector
          label="Y target"
          value={state.yNote}
          accentColor={theme.justAccent}
          onChange={(note: NoteName) => updateState("yNote", note)}
          theme={theme}
        />
      </View>

      <View style={sectionStyle}>
        <Pressable style={styles.disclosure} onPress={() => setReadoutsOpen((open) => !open)}>
          <Text style={sectionTitleStyle}>Comparison data</Text>
          <Text style={[styles.disclosureText, { color: theme.primary }]}>{readoutsOpen ? "Hide" : "Show"}</Text>
        </Pressable>
        {readoutsOpen ? <ReadoutPanel comparison={comparison} xNote={state.xNote} yNote={state.yNote} theme={theme} /> : null}
      </View>

      <View style={sectionStyle}>
        <Text style={sectionTitleStyle}>Audio</Text>
        <Pressable
          style={[styles.primaryButton, { backgroundColor: state.audioEnabled ? theme.stop : theme.primary }]}
          onPress={toggleAudio}
        >
          <Text style={[styles.primaryButtonText, { color: theme.selectedText }]}>
            {state.audioEnabled ? "Disable audio" : "Enable audio"}
          </Text>
        </Pressable>
        {shouldShowAudioSideSelector(state) ? (
          <SegmentedControl
            options={AUDIO_TEMPERAMENTS}
            value={state.audioTemperament}
            onChange={(value: AudioTemperament) => updateState("audioTemperament", value)}
            theme={theme}
          />
        ) : null}
        {state.audioEnabled ? (
          <View style={styles.volumeRow}>
            <Text style={[styles.volumeLabel, { color: theme.textMuted }]}>Volume</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.01}
              value={state.volume}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.sliderTrack}
              thumbTintColor={theme.primary}
              onValueChange={(value) => updateState("volume", value)}
            />
            <Text style={[styles.volumeValue, { color: theme.text }]}>{Math.round(state.volume * 100)}%</Text>
          </View>
        ) : null}
        <Text style={statusTextStyle}>{state.audioEnabled ? audio.status : "Audio is off."}</Text>
      </View>

      <View style={sectionStyle}>
        <Text style={sectionTitleStyle}>Export</Text>
        <Pressable
          style={[styles.secondaryButton, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}
          onPress={shareImage}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.primarySoftText }]}>Share comparison PNG</Text>
        </Pressable>
        <SegmentedControl options={ANIMATED_EXPORT_OPTIONS} value={animatedDuration} onChange={setAnimatedDuration} theme={theme} />
        <Pressable
          style={[styles.primaryButton, { backgroundColor: animatedExporting ? theme.stop : theme.primary }]}
          onPress={shareAnimation}
          disabled={animatedExporting}
        >
          <Text style={[styles.primaryButtonText, { color: theme.selectedText }]}>
            {animatedExporting ? "Creating animated GIF..." : "Share animated GIF"}
          </Text>
        </Pressable>
        <Text style={statusTextStyle}>{exportStatus}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.statusBarStyle} />
      {useLandscapeLayout ? (
        <View style={styles.landscapePage}>
          {header}
          <View style={styles.landscapeBody}>
            <View style={styles.visualizerColumn}>
              <Visualizer
                ref={visualizerRef}
                comparison={comparison}
                height={visualizerHeight}
                theme={theme}
                viewMode={state.viewMode}
              />
            </View>
            <ScrollView
              style={styles.landscapeControls}
              contentContainerStyle={styles.landscapeControlsContent}
              showsVerticalScrollIndicator={false}
            >
              {controls}
            </ScrollView>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {header}
          <Visualizer
            ref={visualizerRef}
            comparison={comparison}
            height={visualizerHeight}
            theme={theme}
            viewMode={state.viewMode}
          />
          {controls}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    gap: 14,
    padding: 14,
    paddingBottom: 34,
  },
  landscapePage: {
    flex: 1,
    gap: 12,
    padding: 14,
  },
  landscapeBody: {
    flex: 1,
    flexDirection: "row",
    gap: 14,
    minHeight: 0,
  },
  visualizerColumn: {
    flex: 1.15,
    minWidth: 0,
  },
  landscapeControls: {
    flex: 1,
    minWidth: 320,
  },
  landscapeControlsContent: {
    paddingBottom: 18,
  },
  controlStack: {
    gap: 14,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  disclosure: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  disclosureText: {
    fontSize: 13,
    fontWeight: "800",
  },
  primaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "900",
  },
  volumeRow: {
    minHeight: 46,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  volumeLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
  slider: {
    flex: 1,
    minWidth: 160,
  },
  volumeValue: {
    width: 46,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "right",
  },
  statusText: {
    fontSize: 12,
    lineHeight: 17,
  },
});

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
