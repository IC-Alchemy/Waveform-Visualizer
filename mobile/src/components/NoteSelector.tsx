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
  const whiteKeyFace = theme.mode === "dark" ? "#eef3f8" : theme.surfaceRaised;
  const whiteKeyPressed = theme.mode === "dark" ? "#d7e1ed" : theme.surfaceControlMuted;
  const whiteKeyBorder = theme.mode === "dark" ? "#aab8ca" : theme.border;
  const whiteKeyText = theme.mode === "dark" ? "#0b1420" : theme.text;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: theme.textMuted }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.keyboard, { width: keyboardWidth, backgroundColor: theme.surfaceControl, borderColor: theme.border }]}>
          <View style={styles.whiteRow}>
            {whiteKeys.map((key) => {
              const selected = key.note === value;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={key.note}
                  onPress={() => onChange(key.note)}
                  style={({ pressed }) => [
                    styles.whiteKey,
                    {
                      backgroundColor: pressed ? whiteKeyPressed : whiteKeyFace,
                      borderColor: whiteKeyBorder,
                    },
                    selected && styles.selectedKey,
                    selected && {
                      backgroundColor: pressed ? whiteKeyPressed : whiteKeyFace,
                      borderColor: pressed ? theme.primaryPressed : accentColor,
                      shadowColor: accentColor,
                    },
                    pressed && styles.pressedKey,
                  ]}
                >
                  {selected ? <View style={[styles.whiteSelectedIndicator, { backgroundColor: accentColor }]} /> : null}
                  <Text style={[styles.whiteKeyText, { color: whiteKeyText }, selected && { color: accentColor }]}>
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
                style={({ pressed }) => [
                  styles.blackKey,
                  {
                    backgroundColor: pressed ? theme.primaryPressed : theme.keySharpBackground,
                    borderColor: pressed ? theme.primaryPressed : theme.keySharpBorder,
                    left,
                  },
                  selected && styles.selectedKey,
                  selected && {
                    backgroundColor: pressed ? theme.primaryPressed : theme.keySharpBackground,
                    borderColor: pressed ? theme.primaryPressed : accentColor,
                    shadowColor: accentColor,
                  },
                  pressed && styles.pressedKey,
                ]}
              >
                {selected ? <View style={[styles.blackSelectedIndicator, { backgroundColor: accentColor }]} /> : null}
                <Text
                  style={[
                    styles.blackKeyText,
                    { color: theme.keySharpText },
                    selected && { color: "#ffffff" },
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
    borderWidth: 1,
    borderRadius: 7,
    paddingTop: 3,
    overflow: "visible",
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
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    paddingBottom: 8,
    overflow: "hidden",
  },
  blackKey: {
    position: "absolute",
    top: 3,
    zIndex: 2,
    width: BLACK_KEY_WIDTH,
    height: BLACK_KEY_HEIGHT,
    alignItems: "center",
    justifyContent: "flex-end",
    borderWidth: 1,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    paddingBottom: 5,
    overflow: "hidden",
  },
  selectedKey: {
    zIndex: 3,
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  pressedKey: {
    transform: [{ translateY: 1 }],
  },
  whiteSelectedIndicator: {
    position: "absolute",
    left: 4,
    right: 4,
    top: 5,
    height: 6,
    borderRadius: 999,
  },
  blackSelectedIndicator: {
    position: "absolute",
    left: 4,
    right: 4,
    top: 4,
    height: 4,
    borderRadius: 999,
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
