import { Pressable, StyleSheet, Text, View } from "react-native";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: Array<Option<T>>;
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <View style={styles.group}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.button, selected && styles.selectedButton]}
          >
            <Text style={[styles.label, selected && styles.selectedLabel]}>{option.label}</Text>
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
    backgroundColor: "#ffffff",
    shadowColor: "#1d252f",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    color: "#53606e",
    fontSize: 13,
    fontWeight: "700",
  },
  selectedLabel: {
    color: "#0f1720",
  },
});
