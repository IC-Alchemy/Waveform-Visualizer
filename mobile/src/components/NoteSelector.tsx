import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NOTE_RANGE, type NoteName } from "../model/comparison";
import type { AppTheme } from "../model/ui";

const WHITE_KEY_WIDTH = 34;
const WHITE_KEY_HEIGHT = 72;
const BLACK_KEY_WIDTH = 22;
const BLACK_KEY_HEIGHT = 46;

interface NoteSelectorProps {
  label: string;
  value: NoteName;
  onChange: (note: NoteName) => void;
  accentColor: string;
  theme: AppTheme;
}

export function NoteSelector({ label, value, onChange, accentColor, theme }: NoteSelectorProps) {
  const whiteKeys = NOTE_RANGE.filter((key) => !isSharpKey(key.name));
  const blackKeys = NOTE_RANGE.filter((key) => isSharpKey(key.name));
  const keyboardWidth = whiteKeys.length * WHITE_KEY_WIDTH;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: theme.textMuted }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.keyboard, { width: keyboardWidth }]}>
          <View style={styles.whiteRow}>
            {whiteKeys.map((key) => {
              const selected = key.note === value;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={key.note}
                  onPress={() => onChange(key.note)}
                  style={[
                    styles.whiteKey,
                    {
                      backgroundColor: theme.surfaceRaised,
                      borderColor: theme.border,
                    },
                    selected && { backgroundColor: accentColor, borderColor: accentColor },
                  ]}
                >
                  <Text style={[styles.whiteKeyText, { color: theme.text }, selected && { color: theme.selectedText }]}>
                    {key.note}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {blackKeys.map((key) => {
            const selected = key.note === value;
            const left = blackKeyLeftOffset(key.midi, whiteKeys);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={key.note}
                onPress={() => onChange(key.note)}
                style={[
                  styles.blackKey,
                  {
                    backgroundColor: theme.keySharpBackground,
                    borderColor: theme.keySharpBorder,
                    left,
                  },
                  selected && { backgroundColor: accentColor, borderColor: accentColor },
                ]}
              >
                <Text
                  style={[
                    styles.blackKeyText,
                    { color: theme.keySharpText },
                    selected && { color: theme.selectedText },
                  ]}
                >
                  {key.note}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function isSharpKey(name: string) {
  return name.includes("#");
}

function blackKeyLeftOffset(midi: number, whiteKeys: typeof NOTE_RANGE) {
  const previousWhiteCount = whiteKeys.filter((key) => key.midi < midi).length;
  return previousWhiteCount * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2;
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: "800",
  },
  scrollContent: {
    paddingRight: 4,
  },
  keyboard: {
    height: WHITE_KEY_HEIGHT + 8,
  },
  whiteRow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    flexDirection: "row",
  },
  whiteKey: {
    width: WHITE_KEY_WIDTH,
    height: WHITE_KEY_HEIGHT,
    alignItems: "center",
    justifyContent: "flex-end",
    borderWidth: 1,
    borderRadius: 2,
    paddingBottom: 8,
  },
  blackKey: {
    position: "absolute",
    top: 0,
    zIndex: 2,
    width: BLACK_KEY_WIDTH,
    height: BLACK_KEY_HEIGHT,
    alignItems: "center",
    justifyContent: "flex-end",
    borderWidth: 1,
    borderRadius: 2,
    paddingBottom: 5,
  },
  whiteKeyText: {
    fontSize: 10,
    fontWeight: "900",
  },
  blackKeyText: {
    fontSize: 8,
    fontWeight: "900",
  },
});
