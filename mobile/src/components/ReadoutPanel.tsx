import { StyleSheet, Text, View } from "react-native";
import { type ComparisonResult, formatHz, formatSigned } from "../model/comparison";

interface ReadoutPanelProps {
  comparison: ComparisonResult;
  xNote: string;
  yNote: string;
}

export function ReadoutPanel({ comparison, xNote, yNote }: ReadoutPanelProps) {
  const rows = [
    ["Notes", `${xNote} -> ${yNote}`],
    ["Interval", `${comparison.intervalLabel} (${comparison.semitones})`],
    ["Equal ratio", comparison.eqRatio.toFixed(6)],
    ["Just ratio", comparison.justLabel],
    ["Equal Y", formatHz(comparison.equalY)],
    ["Just Y", formatHz(comparison.justY)],
    ["Hz delta", formatSigned(comparison.hzDelta, "Hz")],
    ["Cents delta", formatSigned(comparison.centsDelta, "cents")],
  ];

  return (
    <View style={styles.panel}>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.row}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 8,
  },
  row: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  label: {
    color: "#657181",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  value: {
    flexShrink: 1,
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },
});
