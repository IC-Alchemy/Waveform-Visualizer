import { StatusBar } from "expo-status-bar";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useRef, useState, type ReactNode } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { OptionModal, PickerOption } from "./src/components/OptionModal";
import { SegmentedControl } from "./src/components/SegmentedControl";
import { ValueSlider } from "./src/components/ValueSlider";
import { Visualizer, VisualizerHandle } from "./src/components/Visualizer";
import {
  applyFrequencyMode,
  Axis,
  clampFrequency,
  cloneDefaultState,
  FrequencyMode,
  formatFrequency,
  formatRatio,
  INTERVALS,
  MAX_FREQUENCY,
  MIN_FREQUENCY,
  NOTE_OPTIONS,
  ScopeState,
  TraceStyle,
  updateOscillator,
  Waveform,
  WAVEFORMS,
} from "./src/model/oscilloscope";

const MODE_OPTIONS: Array<{ value: FrequencyMode; label: string }> = [
  { value: "hz", label: "Hz" },
  { value: "note", label: "Note" },
  { value: "interval", label: "Interval" },
];

const TRACE_STYLE_OPTIONS: Array<PickerOption<TraceStyle>> = [
  { value: "hybrid", label: "Hybrid" },
  { value: "points", label: "Points" },
  { value: "lines", label: "Connected" },
];

const NOTE_PICKER_OPTIONS = NOTE_OPTIONS.map((note) => ({ value: note, label: note }));
const INTERVAL_PICKER_OPTIONS = INTERVALS.map((interval) => ({ value: interval.value, label: interval.label }));
const WAVEFORM_PICKER_OPTIONS = WAVEFORMS.map((wave) => ({ value: wave.value, label: wave.label }));
const PHOSPHOR_COLORS = [
  { value: "#5cff9f", label: "Green" },
  { value: "#ffbf63", label: "Amber" },
  { value: "#78d8ff", label: "Blue" },
  { value: "#e8fff6", label: "White" },
];

export default function App() {
  return (
    <SafeAreaProvider>
      <ScopeScreen />
    </SafeAreaProvider>
  );
}

function ScopeScreen() {
  const [scope, setScope] = useState<ScopeState>(() => applyFrequencyMode(cloneDefaultState()));
  const [openPicker, setOpenPicker] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState("Ready.");
  const visualizerRef = useRef<VisualizerHandle>(null);
  const { width, height } = useWindowDimensions();
  const visualizerHeight = Math.max(280, Math.min(height * 0.48, width * 0.86));

  const patchScope = (updater: (state: ScopeState) => ScopeState) => {
    setScope((current) => updater(current));
  };

  const setFrequencyMode = (freqMode: FrequencyMode) => {
    patchScope((current) => applyFrequencyMode({ ...current, tuning: { ...current.tuning, freqMode } }));
  };

  const setInterval = (interval: string) => {
    patchScope((current) => applyFrequencyMode({ ...current, tuning: { ...current.tuning, freqMode: "interval", interval } }));
  };

  const setTemperament = (temperament: "equal" | "just") => {
    patchScope((current) => applyFrequencyMode({ ...current, tuning: { ...current.tuning, freqMode: "interval", temperament } }));
  };

  const setFrequency = (axis: Axis, freq: number) => {
    patchScope((current) => {
      const next = updateOscillator(current, axis, { freq: clampFrequency(freq, current[axis].freq) });
      next.tuning.freqMode = "hz";
      return applyFrequencyMode(next);
    });
  };

  const setNote = (axis: Axis, note: string) => {
    patchScope((current) => {
      const next = updateOscillator(current, axis, { note });
      next.tuning.freqMode = "note";
      return applyFrequencyMode(next);
    });
  };

  const setOscValue = (axis: Axis, patch: Partial<ScopeState[Axis]>) => {
    patchScope((current) => updateOscillator(current, axis, patch));
  };

  const sharePng = async () => {
    try {
      setExportStatus("Rendering PNG...");
      const base64 = await visualizerRef.current?.capturePngBase64();
      if (!base64 || !FileSystem.cacheDirectory) {
        throw new Error("No visualizer image was captured.");
      }
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error("Android sharing is not available in this runtime.");
      }
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const uri = `${FileSystem.cacheDirectory}waveform-visualizer-${stamp}.png`;
      await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Share waveform PNG" });
      setExportStatus("PNG shared from the native Skia canvas.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export failed.";
      setExportStatus(message);
      Alert.alert("PNG export", message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>Virtual Analog XY Oscilloscope</Text>
          <Text style={styles.subtitle}>{formatRatio(scope.x.freq, scope.y.freq)} / {scope.tuning.freqMode.toUpperCase()}</Text>
        </View>

        <Visualizer ref={visualizerRef} state={scope} height={visualizerHeight} />

        <Section title="Tuning">
          <Label text="Mode" />
          <SegmentedControl options={MODE_OPTIONS} value={scope.tuning.freqMode} onChange={setFrequencyMode} />
          <Field label="Interval">
            <OptionModal
              title="Interval"
              options={INTERVAL_PICKER_OPTIONS}
              value={scope.tuning.interval}
              disabled={scope.tuning.freqMode !== "interval"}
              open={openPicker === "interval"}
              onOpenChange={(open) => setOpenPicker(open ? "interval" : null)}
              onChange={setInterval}
            />
          </Field>
          <Label text="Temperament" />
          <SegmentedControl
            options={[
              { value: "equal", label: "Equal" },
              { value: "just", label: "Just" },
            ]}
            value={scope.tuning.temperament}
            onChange={setTemperament}
          />
          <ValueSlider
            label="Reference"
            value={scope.tuning.referenceFreq}
            min={MIN_FREQUENCY}
            max={MAX_FREQUENCY}
            step={0.01}
            format={formatFrequency}
            onChange={(value) =>
              patchScope((current) => applyFrequencyMode({ ...current, tuning: { ...current.tuning, referenceFreq: clampFrequency(value) } }))
            }
          />
        </Section>

        <OscillatorSection
          axis="x"
          title="Oscillator X"
          scope={scope}
          openPicker={openPicker}
          setOpenPicker={setOpenPicker}
          onFrequency={setFrequency}
          onNote={setNote}
          onOscValue={setOscValue}
        />
        <OscillatorSection
          axis="y"
          title="Oscillator Y"
          scope={scope}
          openPicker={openPicker}
          setOpenPicker={setOpenPicker}
          onFrequency={setFrequency}
          onNote={setNote}
          onOscValue={setOscValue}
        />

        <Section title="Display">
          <ValueSlider label="Persistence" value={scope.persistence} min={0.86} max={0.997} step={0.001} format={(v) => v.toFixed(3)} onChange={(persistence) => patchScope((current) => ({ ...current, persistence }))} />
          <ValueSlider label="Trace intensity" value={scope.intensity} min={0.04} max={0.9} step={0.001} format={(v) => v.toFixed(3)} onChange={(intensity) => patchScope((current) => ({ ...current, intensity }))} />
          <ValueSlider label="Focus" value={scope.focus} min={1.2} max={5} step={0.1} format={(v) => `${v.toFixed(1)} px`} onChange={(focus) => patchScope((current) => ({ ...current, focus }))} />
          <ValueSlider label="Trace antialias" value={scope.traceAntialias} min={0} max={1} step={0.01} format={(v) => v.toFixed(2)} onChange={(traceAntialias) => patchScope((current) => ({ ...current, traceAntialias }))} />
          <Field label="Trace style">
            <OptionModal title="Trace style" options={TRACE_STYLE_OPTIONS} value={scope.traceStyle} open={openPicker === "traceStyle"} onOpenChange={(open) => setOpenPicker(open ? "traceStyle" : null)} onChange={(traceStyle) => patchScope((current) => ({ ...current, traceStyle }))} />
          </Field>
          <Label text="Phosphor color" />
          <View style={styles.swatches}>
            {PHOSPHOR_COLORS.map(({ value: color, label }) => (
              <Pressable
                key={color}
                accessibilityRole="radio"
                accessibilityLabel={`${label} phosphor`}
                accessibilityState={{ checked: scope.phosphorColor === color }}
                style={[styles.swatch, { backgroundColor: color }, scope.phosphorColor === color && styles.activeSwatch]}
                onPress={() => patchScope((current) => ({ ...current, phosphorColor: color }))}
              />
            ))}
          </View>
          <ValueSlider label="Decay" value={scope.decay} min={0.82} max={1} step={0.001} format={(v) => v.toFixed(3)} onChange={(decay) => patchScope((current) => ({ ...current, decay }))} />
          <ValueSlider label="Bloom" value={scope.bloom} min={0} max={2.2} step={0.01} format={(v) => v.toFixed(2)} onChange={(bloom) => patchScope((current) => ({ ...current, bloom }))} />
          <ValueSlider label="Trace window" value={scope.window} min={0.002} max={0.08} step={0.001} format={(v) => `${(v * 1000).toFixed(1)} ms`} onChange={(window) => patchScope((current) => ({ ...current, window }))} />
          <ValueSlider label="Samples/frame" value={scope.samples} min={512} max={16384} step={512} format={(v) => String(Math.round(v))} onChange={(samples) => patchScope((current) => ({ ...current, samples: Math.round(samples) }))} />
          <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={() => patchScope((current) => ({ ...current, frozen: !current.frozen }))}>
            <Text style={styles.primaryButtonText}>{scope.frozen ? "Resume" : "Freeze"}</Text>
          </Pressable>
        </Section>

        <Section title="Renderer">
          <Text style={styles.stat}>Live samples: {Math.round(scope.samples)}</Text>
          <ValueSlider label="Export scale" value={scope.exportScale} min={1} max={3} step={0.5} format={(v) => `${v.toFixed(1)}x`} onChange={(exportScale) => patchScope((current) => ({ ...current, exportScale }))} />
          <ValueSlider label="Export samples" value={scope.exportSamples} min={16384} max={65536} step={4096} format={(v) => String(Math.round(v))} onChange={(exportSamples) => patchScope((current) => ({ ...current, exportSamples: Math.round(exportSamples) }))} />
          <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={sharePng}>
            <Text style={styles.primaryButtonText}>Share PNG</Text>
          </Pressable>
          <Text style={styles.status}>{exportStatus}</Text>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function OscillatorSection({
  axis,
  title,
  scope,
  openPicker,
  setOpenPicker,
  onFrequency,
  onNote,
  onOscValue,
}: {
  axis: Axis;
  title: string;
  scope: ScopeState;
  openPicker: string | null;
  setOpenPicker: (key: string | null) => void;
  onFrequency: (axis: Axis, value: number) => void;
  onNote: (axis: Axis, note: string) => void;
  onOscValue: (axis: Axis, patch: Partial<ScopeState[Axis]>) => void;
}) {
  const osc = scope[axis];
  return (
    <Section title={title}>
      <Field label="Waveform">
        <OptionModal title={`${title} waveform`} options={WAVEFORM_PICKER_OPTIONS} value={osc.wave} open={openPicker === `${axis}-wave`} onOpenChange={(open) => setOpenPicker(open ? `${axis}-wave` : null)} onChange={(wave) => onOscValue(axis, { wave: wave as Waveform })} />
      </Field>
      <ValueSlider label="Frequency" accessibilityLabel={`${title} frequency`} value={osc.freq} min={MIN_FREQUENCY} max={MAX_FREQUENCY} step={0.01} format={formatFrequency} onChange={(value) => onFrequency(axis, value)} />
      <Field label="Note">
        <OptionModal title={`${title} note`} options={NOTE_PICKER_OPTIONS} value={osc.note} disabled={scope.tuning.freqMode === "hz"} open={openPicker === `${axis}-note`} onOpenChange={(open) => setOpenPicker(open ? `${axis}-note` : null)} onChange={(note) => onNote(axis, note)} />
      </Field>
      <ValueSlider label="Amplitude" accessibilityLabel={`${title} amplitude`} value={osc.amp} min={0} max={1} step={0.001} format={(v) => v.toFixed(3)} onChange={(amp) => onOscValue(axis, { amp })} />
      <ValueSlider label="Phase" accessibilityLabel={`${title} phase`} value={osc.phase} min={-180} max={180} step={0.1} format={(v) => `${v.toFixed(1)} deg`} onChange={(phase) => onOscValue(axis, { phase })} />
      <ValueSlider label="Offset" accessibilityLabel={`${title} offset`} value={osc.offset} min={-0.9} max={0.9} step={0.001} format={(v) => v.toFixed(3)} onChange={(offset) => onOscValue(axis, { offset })} />
    </Section>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Label text={label} />
      {children}
    </View>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#020706",
  },
  scroll: {
    flex: 1,
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
    color: "#eafff3",
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "900",
  },
  subtitle: {
    color: "#85ad9c",
    fontSize: 13,
    fontWeight: "700",
  },
  section: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1d3f34",
    backgroundColor: "#06110f",
    padding: 12,
    gap: 10,
  },
  sectionTitle: {
    color: "#eafff3",
    fontSize: 17,
    fontWeight: "900",
  },
  sectionBody: {
    gap: 12,
  },
  field: {
    gap: 6,
  },
  label: {
    color: "#bdd5ca",
    fontSize: 13,
    fontWeight: "900",
  },
  swatches: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#10251f",
  },
  activeSwatch: {
    borderColor: "#ffffff",
  },
  primaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    backgroundColor: "#5cff9f",
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: "#04100c",
    fontSize: 15,
    fontWeight: "900",
  },
  stat: {
    color: "#9db8ad",
    fontSize: 13,
    fontWeight: "800",
  },
  status: {
    color: "#9db8ad",
    fontSize: 12,
    fontWeight: "700",
  },
});
