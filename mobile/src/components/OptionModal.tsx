import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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
        disabled={disabled}
        style={[styles.trigger, disabled && styles.disabled]}
        onPress={() => onOpenChange(true)}
      >
        <Text style={[styles.triggerText, disabled && styles.disabledText]}>{selected?.label ?? String(value)}</Text>
        <Text style={[styles.chevron, disabled && styles.disabledText]}>v</Text>
      </Pressable>
      <Modal animationType="fade" transparent visible={open} onRequestClose={() => onOpenChange(false)}>
        <Pressable style={styles.backdrop} onPress={() => onOpenChange(false)}>
          <View style={styles.sheet}>
            <Text style={styles.title}>{title}</Text>
            <ScrollView style={styles.list}>
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    key={String(option.value)}
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
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 42,
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
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.58)",
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
    minHeight: 42,
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
