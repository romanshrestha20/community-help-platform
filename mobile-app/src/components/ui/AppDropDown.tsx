// components/ui/AppDropdown.tsx
import React from "react";
import { View, Text, Pressable, StyleSheet, FlatList } from "react-native";
import { AppModal } from "./AppModal";
import { useModal } from "@/hooks/useModal";
import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Option = {
  label: string;
  value: string;
};

type Props = {
  label?: string;
  value?: string;
  options: Option[];
  onSelect: (value: string) => void;
  placeholder?: string;
};

export const AppDropdown = ({
  label,
  value,
  options,
  onSelect,
  placeholder = "Select",
}: Props) => {
  const { visible, open, close } = useModal();
  const { palette } = useThemeContext();

  const selectedLabel =
    options.find((o) => o.value === value)?.label || placeholder;

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: palette.textPrimary }]}>{label}</Text>}

      <Pressable style={[styles.trigger, { borderColor: palette.border, backgroundColor: palette.surface }]} onPress={open}>
        <Text style={[styles.triggerText, { color: palette.textPrimary }]}>{selectedLabel}</Text>
      </Pressable>

      <AppModal visible={visible} title={label || "Select"} onClose={close}>
        <FlatList
          data={options}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => {
            const active = item.value === value;

            return (
              <Pressable
                style={[
                  styles.option,
                  { borderBottomColor: palette.border },
                  active && { backgroundColor: palette.primary },
                ]}
                onPress={() => {
                  onSelect(item.value);
                  close();
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: palette.textPrimary },
                    active && styles.optionTextActive,
                    active && { color: palette.textInverse },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </AppModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm,
  },

  label: {
    marginBottom: 6,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },

  trigger: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
  },

  triggerText: {
    fontSize: theme.typography.fontSize.sm,
  },

  option: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
  },

  optionText: {
    fontSize: theme.typography.fontSize.sm,
  },

  optionTextActive: {
  },
});