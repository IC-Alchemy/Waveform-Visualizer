import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export interface PickerOption<T extends string | number> {
  value: T;
  label: string;
}

interface OptionModalProps<T extends string | number> {
  title: string;
  options: PickerOption<T>[];
  value: T;
  disabled?: boolean;
  onChange: (value: T) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OptionModal<T extends string | number>({
  title,
  options,
  value,
  disabled,
  onChange,
  open,
  onOpenChange,
}: OptionModalProps<T>) {
  const selected = options.find((option) => option.value === value) || options[0];
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityValue={{ text: selected?.label ?? String(value) }}
        accessibilityState={{ disabled: !!disabled, expanded: open }}
        disabled={disabled}
        style={[styles.trigger, disabled && styles.disabled]}
        onPress={() => onOpenChange(true)}
      >
        <Text style={[styles.triggerText, disabled && styles.disabledText]}>{selected?.label ?? String(value)}</Text>
        <Text style={[styles.chevron, disabled && styles.disabledText]}>v</Text>
      </Pressable>
      <Modal
        animationType="fade"
        transparent
        statusBarTranslucent
        navigationBarTranslucent
        visible={open}
        onRequestClose={() => onOpenChange(false)}
      >
        {/* A Modal is a separate native window and needs its own inset measurements. */}
        <SafeAreaProvider style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            accessibilityLabel={`Close ${title} picker`}
            onPress={() => onOpenChange(false)}
          />
          <SafeAreaView style={styles.modalSafeArea} pointerEvents="box-none">
            <View style={styles.sheet}>
              <Text accessibilityRole="header" style={styles.title}>{title}</Text>
              <ScrollView style={styles.list}>
                {options.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <Pressable
                      key={String(option.value)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isSelected }}
                      style={[styles.option, isSelected && styles.optionSelected]}
                      onPress={() => {
                        onChange(option.value);
                        onOpenChange(false);
                      }}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionSelectedText]}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#285344",
    backgroundColor: "#07120f",
    paddingHorizontal: 12,
  },
  disabled: {
    opacity: 0.45,
  },
  triggerText: {
    color: "#ecfff4",
    fontWeight: "700",
  },
  chevron: {
    color: "#5cff9f",
    fontWeight: "900",
  },
  disabledText: {
    color: "#82958d",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.58)",
  },
  modalSafeArea: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "72%",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
    borderColor: "#24483b",
    backgroundColor: "#06110f",
    padding: 14,
  },
  title: {
    color: "#eafff3",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
  },
  list: {
    maxHeight: 460,
  },
  option: {
    minHeight: 48,
    justifyContent: "center",
    borderRadius: 6,
    paddingHorizontal: 12,
  },
  optionSelected: {
    backgroundColor: "#14382c",
  },
  optionText: {
    color: "#c8ded4",
    fontSize: 15,
  },
  optionSelectedText: {
    color: "#5cff9f",
    fontWeight: "900",
  },
});
