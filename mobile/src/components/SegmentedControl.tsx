import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AppTheme } from "../model/ui";

interface Option<T extends string | number> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string | number> {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  theme: AppTheme;
}

export function SegmentedControl<T extends string | number>({ options, value, onChange, theme }: SegmentedControlProps<T>) {
  return (
    <View style={[styles.group, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: pressed ? theme.surfaceControlMuted : "transparent",
                borderColor: pressed ? theme.border : "transparent",
              },
              selected && styles.selectedButton,
              selected && {
                backgroundColor: pressed ? theme.primaryPressed : theme.primary,
                borderColor: pressed ? theme.primaryPressed : theme.primary,
                shadowColor: theme.shadow,
              },
              pressed && styles.pressedButton,
            ]}
          >
            <Text style={[styles.label, { color: selected ? theme.selectedText : theme.textMuted }]}>{option.label}</Text>
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
    borderWidth: 1,
    padding: 4,
  },
  button: {
    minHeight: 40,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
  },
  selectedButton: {
    shadowOpacity: 0.16,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  pressedButton: {
    transform: [{ scale: 0.98 }],
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
});
