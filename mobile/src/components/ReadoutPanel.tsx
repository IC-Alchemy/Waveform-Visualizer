import { StyleSheet, Text, View } from "react-native";
import { type ComparisonResult, formatHz, formatSigned } from "../model/comparison";
import type { AppTheme } from "../model/ui";

interface ReadoutPanelProps {
  comparison: ComparisonResult;
  xNote: string;
  yNote: string;
  theme: AppTheme;
}

export function ReadoutPanel({ comparison, xNote, yNote, theme }: ReadoutPanelProps) {
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
          <Text style={[styles.label, { color: theme.textSubtle }]}>{label}</Text>
          <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
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
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  value: {
    flex: 1,
    minWidth: 150,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },
});
