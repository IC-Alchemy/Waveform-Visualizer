import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AppTheme } from "../model/ui";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: Array<Option<T>>;
  value: T;
  onChange: (value: T) => void;
  theme: AppTheme;
}

export function SegmentedControl<T extends string>({ options, value, onChange, theme }: SegmentedControlProps<T>) {
  return (
    <View style={[styles.group, { backgroundColor: theme.surfaceMuted }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.button,
              selected && styles.selectedButton,
              selected && { backgroundColor: theme.surfaceRaised, shadowColor: theme.shadow },
            ]}
          >
            <Text style={[styles.label, { color: selected ? theme.text : theme.textMuted }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: "row",
    gap: 6,
    borderRadius: 8,
    backgroundColor: "#e8edf3",
    padding: 4,
  },
  button: {
    minHeight: 40,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    paddingHorizontal: 10,
  },
  selectedButton: {
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
});
