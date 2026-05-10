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
    <View style={[styles.panel, { backgroundColor: theme.surfaceControl, borderColor: theme.border }]}>
      {rows.map(([label, value], index) => (
        <View
          key={label}
          style={[
            styles.row,
            { borderBottomColor: theme.divider },
            index === rows.length - 1 && styles.lastRow,
          ]}
        >
          <Text style={[styles.label, { color: theme.textSubtle }]}>{label}</Text>
          <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  row: {
    minHeight: 30,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    gap: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  value: {
    flex: 1,
    minWidth: 150,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
  },
});
