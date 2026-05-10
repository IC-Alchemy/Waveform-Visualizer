import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NOTE_RANGE, type NoteName } from "../model/comparison";
import type { AppTheme } from "../model/ui";

interface NoteSelectorProps {
  label: string;
  value: NoteName;
  onChange: (note: NoteName) => void;
  accentColor: string;
  theme: AppTheme;
}

export function NoteSelector({ label, value, onChange, accentColor, theme }: NoteSelectorProps) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: theme.textMuted }]}>{label}</Text>
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
                {
                  backgroundColor: theme.surfaceRaised,
                  borderColor: theme.border,
                },
                isSharp && {
                  backgroundColor: theme.keySharpBackground,
                  borderColor: theme.keySharpBorder,
                },
                selected && { backgroundColor: accentColor, borderColor: accentColor },
              ]}
            >
              <Text
                style={[
                  styles.keyText,
                  { color: theme.text },
                  isSharp && { color: theme.keySharpText },
                  selected && { color: theme.selectedText },
                ]}
              >
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
    borderRadius: 6,
  },
  keyText: {
    fontSize: 12,
    fontWeight: "800",
  },
});
