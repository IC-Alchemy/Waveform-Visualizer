import { Pressable, StyleSheet, Text, View } from "react-native";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[styles.button, selected && styles.selected]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.text, selected && styles.selectedText]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    gap: 6,
  },
  button: {
    minHeight: 48,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#24483b",
    backgroundColor: "#0b1b17",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  selected: {
    borderColor: "#5cff9f",
    backgroundColor: "#14382c",
  },
  text: {
    color: "#9db8ad",
    fontSize: 13,
    fontWeight: "700",
  },
  selectedText: {
    color: "#eafff3",
  },
});
