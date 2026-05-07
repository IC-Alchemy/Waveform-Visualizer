import Slider from "@react-native-community/slider";
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
} from "react-native";
import { NoteSelector } from "./src/components/NoteSelector";
import { ReadoutPanel } from "./src/components/ReadoutPanel";
import { SegmentedControl } from "./src/components/SegmentedControl";
import { Visualizer, type VisualizerHandle } from "./src/components/Visualizer";
import { useAudioEngine } from "./src/hooks/useAudioEngine";
import {
  DEFAULT_COMPARISON_STATE,
  computeComparison,
  type AudioTemperament,
  type ComparisonState,
  type NoteName,
  type ViewMode,
} from "./src/model/comparison";
import { AUDIO_TEMPERAMENTS, VIEW_MODES, shouldShowAudioSideSelector } from "./src/model/ui";

export default function App() {
  const [state, setState] = useState<ComparisonState>(DEFAULT_COMPARISON_STATE);
  const [readoutsOpen, setReadoutsOpen] = useState(true);
  const [exportStatus, setExportStatus] = useState("Share exports the current visualizer canvas as PNG.");
  const visualizerRef = useRef<VisualizerHandle>(null);
  const comparison = useMemo(() => computeComparison(state), [state.xNote, state.yNote]);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Interval Temperament</Text>
          <Text style={styles.subtitle}>Native Android comparison of equal temperament and just intonation.</Text>
        </View>

        <Visualizer ref={visualizerRef} comparison={comparison} viewMode={state.viewMode} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visual comparison</Text>
          <SegmentedControl options={VIEW_MODES} value={state.viewMode} onChange={setViewMode} />
        </View>

        <View style={styles.section}>
          <NoteSelector
            label="X root"
            value={state.xNote}
            accentColor="#2563eb"
            onChange={(note: NoteName) => updateState("xNote", note)}
          />
          <NoteSelector
            label="Y target"
            value={state.yNote}
            accentColor="#c2410c"
            onChange={(note: NoteName) => updateState("yNote", note)}
          />
        </View>

        <View style={styles.section}>
          <Pressable style={styles.disclosure} onPress={() => setReadoutsOpen((open) => !open)}>
            <Text style={styles.sectionTitle}>Comparison data</Text>
            <Text style={styles.disclosureText}>{readoutsOpen ? "Hide" : "Show"}</Text>
          </Pressable>
          {readoutsOpen ? <ReadoutPanel comparison={comparison} xNote={state.xNote} yNote={state.yNote} /> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio</Text>
          <Pressable style={[styles.primaryButton, state.audioEnabled && styles.stopButton]} onPress={toggleAudio}>
            <Text style={styles.primaryButtonText}>{state.audioEnabled ? "Disable audio" : "Enable audio"}</Text>
          </Pressable>
          {shouldShowAudioSideSelector(state) ? (
            <SegmentedControl
              options={AUDIO_TEMPERAMENTS}
              value={state.audioTemperament}
              onChange={(value: AudioTemperament) => updateState("audioTemperament", value)}
            />
          ) : null}
          {state.audioEnabled ? (
            <View style={styles.volumeRow}>
              <Text style={styles.volumeLabel}>Volume</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.01}
                value={state.volume}
                minimumTrackTintColor="#2563eb"
                maximumTrackTintColor="#cbd5e1"
                thumbTintColor="#2563eb"
                onValueChange={(value) => updateState("volume", value)}
              />
              <Text style={styles.volumeValue}>{Math.round(state.volume * 100)}%</Text>
            </View>
          ) : null}
          <Text style={styles.statusText}>{state.audioEnabled ? audio.status : "Audio is off."}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export</Text>
          <Pressable style={styles.secondaryButton} onPress={shareImage}>
            <Text style={styles.secondaryButtonText}>Share comparison PNG</Text>
          </Pressable>
          <Text style={styles.statusText}>{exportStatus}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#eef3f8",
  },
  content: {
    gap: 14,
    padding: 14,
    paddingBottom: 34,
  },
  header: {
    gap: 4,
  },
  title: {
    color: "#101820",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0,
  },
  subtitle: {
    color: "#596575",
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d5dde8",
    backgroundColor: "#ffffff",
    padding: 12,
  },
  sectionTitle: {
    color: "#202b38",
    fontSize: 15,
    fontWeight: "900",
  },
  disclosure: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  disclosureText: {
    color: "#2563eb",
    fontSize: 13,
    fontWeight: "800",
  },
  primaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
  },
  stopButton: {
    backgroundColor: "#475569",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: "#1d4ed8",
    fontSize: 15,
    fontWeight: "900",
  },
  volumeRow: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  volumeLabel: {
    color: "#485465",
    fontSize: 13,
    fontWeight: "800",
  },
  slider: {
    flex: 1,
  },
  volumeValue: {
    width: 42,
    color: "#202b38",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "right",
  },
  statusText: {
    color: "#667386",
    fontSize: 12,
    lineHeight: 17,
  },
});
