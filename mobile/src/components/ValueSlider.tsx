import Slider from "@react-native-community/slider";
import { StyleSheet, Text, TextInput, View } from "react-native";

interface ValueSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
  onCommit?: (value: number) => void;
}

export function ValueSlider({ label, value, min, max, step, format, onChange, onCommit }: ValueSliderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{format(value)}</Text>
      </View>
      <View style={styles.controls}>
        <TextInput
          style={styles.input}
          value={formatRaw(value, step)}
          keyboardType="decimal-pad"
          selectTextOnFocus
          onChangeText={(text) => {
            const numeric = Number(text);
            if (Number.isFinite(numeric)) {
              onChange(numeric);
            }
          }}
          onEndEditing={(event) => {
            const numeric = Number(event.nativeEvent.text);
            if (Number.isFinite(numeric)) {
              (onCommit || onChange)(numeric);
            }
          }}
        />
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          step={step}
          value={value}
          minimumTrackTintColor="#5cff9f"
          maximumTrackTintColor="#25453a"
          thumbTintColor="#ecfff4"
          onValueChange={onChange}
          onSlidingComplete={onCommit || onChange}
        />
      </View>
    </View>
  );
}

function formatRaw(value: number, step: number) {
  if (step < 0.01) {
    return value.toFixed(3);
  }
  if (step < 0.1) {
    return value.toFixed(2);
  }
  if (step < 1) {
    return value.toFixed(1);
  }
  return String(Math.round(value));
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  label: {
    color: "#c8ded4",
    fontSize: 13,
    fontWeight: "800",
  },
  value: {
    color: "#5cff9f",
    fontSize: 12,
    fontWeight: "800",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    width: 76,
    minHeight: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#24483b",
    color: "#ecfff4",
    backgroundColor: "#07120f",
    paddingHorizontal: 9,
    fontWeight: "800",
  },
  slider: {
    flex: 1,
    height: 40,
  },
});
