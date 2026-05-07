import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NOTE_RANGE, type NoteName } from "../model/comparison";

interface NoteSelectorProps {
  label: string;
  value: NoteName;
  onChange: (note: NoteName) => void;
  accentColor: string;
}

export function NoteSelector({ label, value, onChange, accentColor }: NoteSelectorProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.keys}>
        {NOTE_RANGE.map((key) => {
          const selected = key.note === value;
          const isSharp = key.name.includes("#");
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={key.note}
              onPress={() => onChange(key.note)}
              style={[
                styles.key,
                isSharp && styles.blackKey,
                selected && { backgroundColor: accentColor, borderColor: accentColor },
              ]}
            >
              <Text style={[styles.keyText, isSharp && styles.blackKeyText, selected && styles.selectedKeyText]}>
                {key.note}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  title: {
    color: "#485465",
    fontSize: 13,
    fontWeight: "800",
  },
  keys: {
    gap: 6,
    paddingRight: 4,
  },
  key: {
    width: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ccd5df",
    borderRadius: 6,
    backgroundColor: "#ffffff",
  },
  blackKey: {
    backgroundColor: "#2a3440",
    borderColor: "#2a3440",
  },
  keyText: {
    color: "#26313f",
    fontSize: 12,
    fontWeight: "800",
  },
  blackKeyText: {
    color: "#f8fafc",
  },
  selectedKeyText: {
    color: "#ffffff",
  },
});
